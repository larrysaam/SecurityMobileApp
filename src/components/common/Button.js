import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants';

const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  ...props
}) => {
  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[size]];
    
    switch (variant) {
      case 'primary':
        baseStyle.push(styles.primary);
        break;
      case 'secondary':
        baseStyle.push(styles.secondary);
        break;
      case 'outline':
        baseStyle.push(styles.outline);
        break;
      case 'ghost':
        baseStyle.push(styles.ghost);
        break;
      case 'danger':
        baseStyle.push(styles.danger);
        break;
      case 'success':
        baseStyle.push(styles.success);
        break;
      default:
        baseStyle.push(styles.primary);
    }

    if (disabled || loading) {
      baseStyle.push(styles.disabled);
    }

    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.text, styles[`${size}Text`]];
    
    switch (variant) {
      case 'primary':
      case 'danger':
      case 'success':
        baseStyle.push(styles.whiteText);
        break;
      case 'secondary':
        baseStyle.push(styles.darkText);
        break;
      case 'outline':
      case 'ghost':
        baseStyle.push(styles.primaryText);
        break;
      default:
        baseStyle.push(styles.whiteText);
    }

    if (disabled || loading) {
      baseStyle.push(styles.disabledText);
    }

    return baseStyle;
  };

  const getIconColor = () => {
    if (disabled || loading) return COLORS.GRAY[400];
    
    switch (variant) {
      case 'primary':
      case 'danger':
      case 'success':
        return COLORS.WHITE;
      case 'secondary':
        return COLORS.DARK;
      case 'outline':
      case 'ghost':
        return COLORS.PRIMARY;
      default:
        return COLORS.WHITE;
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator 
          size="small" 
          color={getIconColor()} 
        />
      );
    }

    const iconElement = icon && (
      <Ionicons 
        name={icon} 
        size={size === 'small' ? 16 : size === 'large' ? 24 : 20} 
        color={getIconColor()}
        style={iconPosition === 'right' ? styles.iconRight : styles.iconLeft}
      />
    );

    const textElement = (
      <Text style={[getTextStyle(), textStyle]}>
        {title}
      </Text>
    );

    return (
      <>
        {iconPosition === 'left' && iconElement}
        {textElement}
        {iconPosition === 'right' && iconElement}
      </>
    );
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: SIZES.BORDER_RADIUS,
    paddingHorizontal: 16,
  },
  
  // Sizes
  small: {
    height: 36,
    paddingHorizontal: 12,
  },
  medium: {
    height: SIZES.BUTTON_HEIGHT,
  },
  large: {
    height: 56,
    paddingHorizontal: 24,
  },

  // Variants
  primary: {
    backgroundColor: COLORS.PRIMARY,
  },
  secondary: {
    backgroundColor: COLORS.GRAY[200],
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: COLORS.SECONDARY,
  },
  success: {
    backgroundColor: COLORS.SUCCESS,
  },
  disabled: {
    backgroundColor: COLORS.GRAY[300],
    borderColor: COLORS.GRAY[300],
  },

  // Text styles
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
  whiteText: {
    color: COLORS.WHITE,
  },
  darkText: {
    color: COLORS.DARK,
  },
  primaryText: {
    color: COLORS.PRIMARY,
  },
  disabledText: {
    color: COLORS.GRAY[500],
  },

  // Icon styles
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});

export default Button;
