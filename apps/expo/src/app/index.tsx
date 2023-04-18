import React, { useEffect, useRef } from "react";
import { Alert, Animated, Easing, Image, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import WebView from "react-native-webview";
import { Camera, CameraType, ImageType, PermissionStatus } from "expo-camera";
// import * as cv from "opencv-bindings";
import * as tf from "@tensorflow/tfjs";
import classes from "~/utils/classes";

import "@tensorflow/tfjs-react-native";

let model: tf.LayersModel | null = null;

const Index = () => {
  const [permission, requestPermission] = Camera.useCameraPermissions();

  useEffect(() => {
    if (
      !permission?.granted &&
      permission?.canAskAgain &&
      permission.status === PermissionStatus.DENIED
    ) {
      void requestPermission();
    }
  }, [permission]);

  const cameraRef = React.useRef<Camera | null>(null);
  const webRef = React.useRef<WebView | null>(null);

  const process = () => {
    if (cameraRef.current && model) {
      void (async function () {
        await tf.ready();
        const pic = await cameraRef.current!.takePictureAsync({
          imageType: ImageType.png,
          base64: true,
        });
        // const image = new Image();
        // image.src = pic.uri;
        // await new Promise((resolve) => {
        //   image.onload = resolve;
        // });
        //           webRef.current!.injectJavaScript(`
        //           async function loadOpenCV() {
        //             const image = new Image();
        //             image.src = \`${pic.uri}\`;
        //             await new Promise((resolve) => {
        //               image.onload = resolve;
        //             });
        //             const img = cv.imread(image);
        //             cv.cvtColor(img, img, cv.COLOR_BGR2GRAY);
        //             cv.resize(img, img, new cv.Size(32, 32), 0, 0, cv.INTER_AREA);
        //             window.ReactNativeWebView.postMessage(
        //               JSON.stringify({
        //                 data: JSON.stringify(img.data),
        //                 rows: JSON.stringify(img.rows),
        //                 cols: JSON.stringify(img.cols),
        //               })
        //             );
        //             // console.log(
        //             //   model!.predict(tensor(img.data, [img.rows, img.cols, -1])),
        //             // );
        //           }
        //           loadOpenCV();
        //           true;
        // `);
        // console.log(pic.base64);
        const imgprocessed: [[number][][]] = await fetch(
          "https://cc9f-2601-647-6780-f30-b0c7-3787-852d-36bb.ngrok-free.app/convert",
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
        // console.log(probs);
        Alert.alert(`${classes[mxi]} Sign`);
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
      <WebView
        ref={webRef}
        onMessage={(event) => {
          console.log("Recieved msg", event);
        }}
        javaScriptEnabled={true}
        source={{
          html: `<html><head><script src="https://docs.opencv.org/4.7.0/opencv.js" /></head></html>`,
        }}
      />
    </SafeAreaView>
  );
};

export default Index;
