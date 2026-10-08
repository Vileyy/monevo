/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { verifyToken } from '@clerk/backend';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleLoginDto } from './dto/google-login.dto';

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    this.googleClient = new OAuth2Client(clientId);
  }

  async register(registerDto: RegisterDto) {
    const { email, password, name } = registerDto;

    const existingUser = await this.usersService.findByEmail(
      email.toLowerCase(),
    );
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await this.usersService.create({
      email: email.toLowerCase(),
      name,
      passwordHash,
    });

    const token = await this.generateToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      accessToken: token,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.usersService.findByEmail(email.toLowerCase());
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = await this.generateToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      accessToken: token,
    };
  }

  async googleLogin(googleLoginDto: GoogleLoginDto) {
    const { idToken } = googleLoginDto;
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const iosClientId = this.configService.get<string>('GOOGLE_IOS_CLIENT_ID');
    const validAudiences = [clientId, iosClientId].filter(
      (id): id is string => typeof id === 'string' && id.length > 0,
    );

    let payload;
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: validAudiences.length > 0 ? validAudiences : undefined,
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Invalid Google token');
    }

    const rawEmail = payload.email;
    if (!rawEmail || typeof rawEmail !== 'string') {
      throw new UnauthorizedException('Google token missing email');
    }

    if (!payload.email_verified) {
      throw new UnauthorizedException('Google email not verified');
    }

    const email = rawEmail.toLowerCase();
    const name: string | undefined =
      typeof payload.name === 'string'
        ? payload.name
        : typeof payload.given_name === 'string'
          ? payload.given_name
          : undefined;

    let user = await this.usersService.findByEmail(email);
    if (!user) {
      const randomPassword = crypto.randomUUID() + crypto.randomUUID();
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(randomPassword, salt);

      user = await this.usersService.create({
        email,
        name,
        passwordHash,
      });
    }

    const token = await this.generateToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      accessToken: token,
    };
  }

  async clerkLogin(clerkToken: string) {
    const secretKey =
      this.configService.get<string>('CLERK_SECRET_KEY') ||
      process.env.CLERK_SECRET_KEY;

    if (!secretKey) {
      throw new UnauthorizedException('Clerk authentication is not configured');
    }

    let verified: { sub?: string; email?: string; email_address?: string };
    try {
      const verifyClerkToken = verifyToken as (
        token: string,
        options: { secretKey: string },
      ) => Promise<{ sub?: string; email?: string; email_address?: string }>;

      verified = await verifyClerkToken(clerkToken, { secretKey });
    } catch {
      throw new UnauthorizedException('Invalid Clerk token');
    }

    if (!verified || !verified.sub) {
      throw new UnauthorizedException('Invalid Clerk token payload');
    }

    const email = verified.email || verified.email_address;
    const user = await this.usersService.findOrCreateByClerk(
      verified.sub,
      email,
    );

    const token = await this.generateToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      accessToken: token,
    };
  }

  private async generateToken(userId: string, email: string): Promise<string> {
    const payload = { sub: userId, email };
    return this.jwtService.signAsync(payload);
  }
}
