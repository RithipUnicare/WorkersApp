import AsyncStorage from '@react-native-async-storage/async-storage';
import PhotoManipulator from 'react-native-photo-manipulator';

export const addTextWatermark = async (uri: string) => {
  const currentUser = await AsyncStorage.getItem('user');
  const parsedUser = currentUser ? JSON.parse(currentUser) : null;
  const actions = [
    {
      text: parsedUser?.name || 'hello',
      position: { x: 300, y: 100 },
      color: '#04ffb0cc',
      thickness: 5,
      textSize: 52,
    },
  ];

  const resultUri = await PhotoManipulator.printText(uri, actions);
  return resultUri;
};
