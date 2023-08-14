import React, { useEffect, useRef } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Camera, CameraType, ImageType } from "expo-camera";
// import * as cv from "opencv-bindings";
import * as tf from "@tensorflow/tfjs";

import classes from "~/utils/classes";
import "@tensorflow/tfjs-react-native";

import { useHUD } from "~/utils/store";

let model: tf.LayersModel | null = null;

const Index = () => {
  const [permission, requestPermission] = Camera.useCameraPermissions();

  useEffect(() => {
    if (!permission?.granted && permission?.canAskAgain) {
      void requestPermission();
    }
  }, [permission]);

  const cameraRef = useRef<Camera | null>(null);

  const process = () => {
    if (cameraRef.current && model) {
      void (async function () {
        await tf.ready();
        const pic = await cameraRef.current!.takePictureAsync({
          imageType: ImageType.png,
          base64: true,
        });

        const imgprocessed: [[number][][]] = await fetch(
          "https://1d83-2a09-bac1-7680-1d18-00-1d3-1a.ngrok-free.app/convert",
          {
            method: "POST",
            body: pic.base64,
          },
        ).then((response) => response.json());
        const imgprocessedagain: [([number] | Float32Array)[][]] = imgprocessed;
        for (let i = 0; i < imgprocessed.length; i++) {
          for (let j = 0; j < imgprocessed[i]!.length; j++) {
            for (let k = 0; k < imgprocessed[i]![j]!.length; k++) {
              const immutable = new Float32Array(
                imgprocessed[i]![j]![k]!.length,
              );
              for (let l = 0; l < imgprocessed[i]![j]![k]!.length; l++) {
                immutable[l] = imgprocessed[i]![j]![k]![l]!;
              }
              imgprocessedagain[i]![j]![k] = immutable;
            }
          }
        }
        let mx = 0;
        let mxi = -1;
        const probs = (
          model.predict(tf.tensor(imgprocessedagain)) as tf.Tensor<tf.Rank>
        ).dataSync();
        for (let i = 0; i < probs.length; i++) {
          if (probs[i]! > mx) {
            mx = probs[i]!;
            mxi = i;
          }
        }

        Alert.alert(`${classes[mxi.toString() as keyof typeof classes]} Sign`);
      })();
    }
  };

  useEffect(() => {
    if (model === null) {
      void (async () => {
        await tf.ready();
        model = await tf.loadLayersModel(
          "https://raw.githubusercontent.com/shreyvish5678/road-sign-detection/main/model.json",
        );
      })();
    }
  }, []);

  const [hud, showHUD] = useHUD();

  return (
    <SafeAreaView className="bg-white">
      <View className="h-full w-full">
        <Camera
          ref={cameraRef}
          type={CameraType.back}
          className="flex h-screen items-center justify-end p-16"
        >
          <TouchableOpacity
            onPress={() => process()}
            activeOpacity={0.6}
            className="h-16 w-16 rounded-full border-4 border-white bg-purple-400"
          />
        </Camera>
      </View>

      {hud ? (
        <View className="absolute bottom-4">
          <Text>{hud.value}</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
};

export default Index;
