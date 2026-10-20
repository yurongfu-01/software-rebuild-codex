import java.util.Locale;

// Self-owned Android-oriented domain logic. Runs on a JDK, not an Android device.
class NameNormalizer {
    public static void main(String[] args) {
        for (String value : args) {
            for (char c : value.toCharArray()) {
                if (c < 32 || c > 126) throw new IllegalArgumentException("ASCII printable string required");
            }
            System.out.println(value.trim().toLowerCase(Locale.ROOT).replaceAll(" +", "-"));
        }
    }
}
