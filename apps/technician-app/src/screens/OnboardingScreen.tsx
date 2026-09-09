// apps/technician-app/src/screens/OnboardingScreen.tsx

import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  StatusBar,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
// import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import type { RootStackParamList } from "@/navigation/types";
import { useAuth } from "@/context/AuthContext";

const onboardingData = [
  {
    id: "1",
    title: "Earn Money as a Technician",
    description:
      "Join FixMate and start earning by repairing devices in your area",
    icon: "🔧",
    color: "#4F46E5",
  },
  {
    id: "2",
    title: "Manage Your Jobs Easily",
    description:
      "Accept jobs, track progress, and get paid - all from your phone",
    icon: "📱",
    color: "#059669",
  },
  {
    id: "3",
    title: "Grow Your Business",
    description:
      "Build your reputation with ratings and reviews from satisfied customers",
    icon: "⭐",
    color: "#D97706",
  },
];

export default function OnboardingScreen() {
  // const navigation = useNavigation();
  type OnboardingNavigationProp = StackNavigationProp<
    RootStackParamList,
    "Onboarding"
  >;

  const navigation = useNavigation<OnboardingNavigationProp>();
  const { width, height } = useWindowDimensions();

  const [currentIndex, setCurrentIndex] = useState(0);

  const scrollX = useRef(new Animated.Value(0)).current;

  const flatListRef = useRef<FlatList>(null);
  const { setHasCompletedOnboarding } = useAuth();
  
  const handleNext = () => {
    const nextIndex = currentIndex + 1;

    if (nextIndex < onboardingData.length) {
      flatListRef.current?.scrollToOffset({
        offset: nextIndex * width,
        animated: true,
      });

      setCurrentIndex(nextIndex);
    } else {
      completeOnboarding();
    }
  };

  // Complete onboarding and go to Register
  const completeOnboarding = async () => {
    try {

      await AsyncStorage.setItem('onboardingCompleted', 'true');
      setHasCompletedOnboarding(true);

    } catch (error) {
      console.error("Failed to save onboarding status:", error);
    }
  };

  // Skip onboarding
  const handleSkip = async () => {
    await completeOnboarding();
  };

  // Update current slide after user swipes
  const handleMomentumScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const offsetX = event.nativeEvent.contentOffset.x;

    const index = Math.round(offsetX / width);

    setCurrentIndex(index);
  };

  const renderItem = ({
    item,
    index,
  }: {
    item: (typeof onboardingData)[0];
    index: number;
  }) => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8],
      extrapolate: "clamp",
    });

    const translateY = scrollX.interpolate({
      inputRange,
      outputRange: [50, 0, 50],
      extrapolate: "clamp",
    });

    return (
      <View
        style={[
          styles.slide,
          {
            width,
            height: height - 200,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [{ scale }],
              backgroundColor: item.color,
            },
          ]}
        >
          <Text style={styles.icon}>{item.icon}</Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.textContainer,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          <Text style={styles.title}>{item.title}</Text>

          <Text style={styles.description}>{item.description}</Text>
        </Animated.View>
      </View>
    );
  };

  const renderPagination = () => {
    return (
      <View style={styles.pagination}>
        {onboardingData.map((_, index) => {
          const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
          ];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: "clamp",
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.5, 1, 0.5],
            extrapolate: "clamp",
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  width: dotWidth,
                  opacity,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={onboardingData[currentIndex]?.color || "#4F46E5"}
      />

      {/* Skip Button */}
      <TouchableOpacity
        style={styles.skipButton}
        onPress={handleSkip}
        activeOpacity={0.8}
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Onboarding Slides */}
      <Animated.FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        // pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        // decelerationRate="fast"
        // snapToInterval={width}
        snapToAlignment="start"
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        onScroll={Animated.event(
          [
            {
              nativeEvent: {
                contentOffset: {
                  x: scrollX,
                },
              },
            },
          ],
          {
            useNativeDriver: false,
          },
        )}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
      />

      {/* Bottom Controls */}
      <View style={styles.bottomContainer}>
        {/* Pagination */}
        {renderPagination()}

        {/* Next / Get Started Button */}
        <TouchableOpacity
          style={[
            styles.nextButton,
            {
              backgroundColor: onboardingData[currentIndex]?.color || "#4F46E5",
            },
          ]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>
            {currentIndex === onboardingData.length - 1
              ? "Get Started"
              : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  skipButton: {
    position: "absolute",
    top: 60,
    right: 20,
    zIndex: 10,
    padding: 10,
  },

  skipText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },

  slide: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },

  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 35,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },

  icon: {
    fontSize: 70,
  },

  textContainer: {
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 10,
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#1a1a2e",
    textAlign: "center",
    marginBottom: 16,
  },

  description: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 340,
  },

  bottomContainer: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },

  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4F46E5",
    marginHorizontal: 4,
  },

  nextButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#4F46E5",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },

  nextButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
