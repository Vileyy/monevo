import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";
import { typography } from "@/theme/typography";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Monevo</Text>
      <Text style={styles.subtitle}>Your money, under control.</Text>
      <TouchableOpacity onPress={() => console.log("Pressed!")}>
        <Text>Press me</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});
