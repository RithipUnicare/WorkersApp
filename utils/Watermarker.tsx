import AsyncStorage from '@react-native-async-storage/async-storage';
import PhotoManipulator from 'react-native-photo-manipulator';

export const addTextWatermark = async (uri: string) => {
  const currentUser = await AsyncStorage.getItem('user');
  const parsedUser = currentUser ? JSON.parse(currentUser) : null;
  const actions = [
    {
      text: parsedUser?.name || '',
      position: { x: -40, y: 40 }, // x: negative means from right
      color: '#ffffffcc',
      thickness: 2,
      textSize: 32,
    },
  ];

  const resultUri = await PhotoManipulator.printText(uri, actions);
  return resultUri;
};
