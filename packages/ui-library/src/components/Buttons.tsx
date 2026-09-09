import React from 'react';
import {
  Pressable,
  Text,
  StyleProp,
  StyleSheet,
  TextStyle,
  ViewStyle,
} from 'react-native';
// usage 
{/* <Button
  onPress={handleLogin}
  backgroundColor="#111827"
  textColor="#FFFFFF"
  width="100%"
  height={60}
  borderRadius={30}
  paddingHorizontal={30}
  paddingVertical={15}
  fontSize={18}
  fontWeight="700"
  style={{
    marginTop: 20,
  }}
>
  Sign In
</Button> */}

export interface ButtonProps {
  /**
   * Function called when the button is pressed
   */
  onPress: () => void;

  /**
   * Button content
   */
  children: React.ReactNode;

  /**
   * Predefined button style
   */
  variant?: 'primary' | 'secondary';

  /**
   * Disable button
   */
  disabled?: boolean;

  /**
   * Custom button background color
   */
  backgroundColor?: string;

  /**
   * Custom text color
   */
  textColor?: string;

  /**
   * Custom button width
   */
  width?: number | `${number}%`;

  /**
   * Custom button height
   */
  height?: number;

  /**
   * Custom border radius
   */
  borderRadius?: number;

  /**
   * Custom padding
   */
  paddingHorizontal?: number;
  paddingVertical?: number;

  /**
   * Custom text size
   */
  fontSize?: number;

  /**
   * Custom font weight
   */
  fontWeight?: TextStyle['fontWeight'];

  /**
   * Custom button style
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Custom text style
   */
  textStyle?: StyleProp<TextStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  onPress,
  children,
  variant = 'primary',
  disabled = false,

  backgroundColor,
  textColor,

  width,
  height,
  borderRadius = 8,

  paddingHorizontal = 20,
  paddingVertical = 12,

  fontSize = 16,
  fontWeight = '600',

  style,
  textStyle,
}) => {
  const variantStyles = {
    primary: {
      backgroundColor: '#3B82F6',
      textColor: '#FFFFFF',
    },
    secondary: {
      backgroundColor: '#E5E7EB',
      textColor: '#1F2937',
    },
  };

  const currentVariant = variantStyles[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,

        {
          backgroundColor:
            backgroundColor || currentVariant.backgroundColor,

          width,
          height,
          borderRadius,

          paddingHorizontal,
          paddingVertical,

          opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
        },

        style,
      ]}
    >
      <Text
        style={[
          styles.text,

          {
            color: textColor || currentVariant.textColor,
            fontSize,
            fontWeight,
          },

          textStyle,
        ]}
      >
        {children}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  text: {
    textAlign: 'center',
  },
});