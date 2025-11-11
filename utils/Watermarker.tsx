import AsyncStorage from '@react-native-async-storage/async-storage';
import PhotoManipulator, {
  TextOptions,
  TextAlign,
} from 'react-native-photo-manipulator';
import { Image } from 'react-native';

export const addTextWatermark = async (uri: string) => {
  const currentUser = await AsyncStorage.getItem('user');
  const parsedUser = currentUser ? JSON.parse(currentUser) : null;

  const label = parsedUser?.name || 'hello';

  // 1. Get image size (needed for bottom-left placement)
  const { width, height } = await new Promise<{
    width: number;
    height: number;
  }>((resolve, reject) => {
    Image.getSize(uri, (w, h) => resolve({ width: w, height: h }), reject);
  });

  // Bottom-left text coordinates
  console.log(width, height);
  const pos = { x: width - 300, y: height - 100 };

  const actions: TextOptions[] = [
    // BACKGROUND layer (black “box” effect)
    {
      text: label,
      position: pos,
      textSize: 80,
      color: '#000000', // black
      thickness: 12, // very thick to create a block behind
      shadowColor: '#000000', // reinforce background
      shadowRadius: 16,
      shadowOffset: { x: 0, y: 0 },
      align: TextAlign.START,
    },

    // FOREGROUND white text
    {
      text: label,
      position: pos,
      textSize: 80,
      color: '#ffffff', // white
      thickness: 3, // slight bold
      shadowColor: '#00000022', // soft glow to lift the text
      shadowRadius: 2,
      shadowOffset: { x: 1, y: 1 },
      align: TextAlign.START,
    },
  ];

  const resultUri = await PhotoManipulator.printText(uri, actions);
  return resultUri;
};
