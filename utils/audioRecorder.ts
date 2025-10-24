import Sound, {
  AudioSet,
  RecordBackType,
  PlayBackType,
  PlaybackEndType,
} from 'react-native-nitro-sound';
import RNFS from 'react-native-fs';
import { Platform } from 'react-native';

// Optional: Global subscription duration (default 0.5s)
Sound.setSubscriptionDuration(0.1); // 100ms updates

// START RECORDING
// Returns the file path if started successfully
export const startRecording = async (
  onProgress: (position: number, metering?: number) => void,
  onError: (err: any) => void,
): Promise<string | null> => {
  try {
    const fileName = `recording_${Date.now()}.m4a`; // iOS default .m4a, Android .mp4 but can rename
    const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;

    // Compression config (cross-platform)
    const audioSet: AudioSet = {
      AudioSamplingRate: 44100,
      AudioEncodingBitRate: 64000, // Low bitrate for compression (64kbps)
      AudioChannels: 1, // Mono for smaller size
    };

    // Add listener
    Sound.addRecordBackListener((e: RecordBackType) => {
      onProgress(e.currentPosition, e.currentMetering);
    });

    // Start with custom path, config, metering
    const uri = await Sound.startRecorder(filePath, audioSet, true);
    return uri; // uri is the filePath
  } catch (err) {
    onError(err);
    return null;
  }
};

// STOP RECORDING
// Returns { filePath: string, duration: number }
export const stopRecording = async (
  onSuccess: (result: { filePath: string; duration: number }) => void,
  onError: (err: any) => void,
) => {
  try {
    const uri = await Sound.stopRecorder();
    Sound.removeRecordBackListener();

    // Get duration: Need to use startPlayer briefly to get duration, or track from listener
    // Here, assuming you track position in onProgress, pass last position as duration
    // For accuracy, quick hack: startPlayer and get duration
    const temp = await Sound.startPlayer(uri);
    const listener = (e: PlayBackType) => {
      if (e.duration > 0) {
        onSuccess({ filePath: uri, duration: e.duration / 1000 });
        Sound.removePlayBackListener();
        Sound.stopPlayer();
      }
    };
    Sound.addPlayBackListener(listener);
  } catch (err) {
    onError(err);
  }
};

// PLAY RECORDING
export const playRecording = async (
  audioPath: string,
  onProgress: (position: number, duration: number) => void,
  onFinish: () => void,
  onError: (err: any) => void,
) => {
  try {
    Sound.addPlayBackListener((e: PlayBackType) => {
      onProgress(e.currentPosition, e.duration);
    });

    Sound.addPlaybackEndListener((e: PlaybackEndType) => {
      onFinish();
    });

    await Sound.startPlayer(audioPath);
  } catch (err) {
    onError(err);
  }
};

// STOP PLAYBACK
export const stopPlayback = async (onError: (err: any) => void) => {
  try {
    await Sound.stopPlayer();
    Sound.removePlayBackListener();
    Sound.removePlaybackEndListener();
  } catch (err) {
    onError(err);
  }
};

// GET FILE FOR API UPLOAD (FormData-ready)
export const getFileForUpload = (audioPath: string) => {
  if (!audioPath) return null;

  const fileName = audioPath.split('/').pop() || 'recording.m4a';

  // Ensure correct URI format
  let uri = audioPath;
  if (Platform.OS === 'android' && !uri.startsWith('file://')) {
    uri = `file://${uri}`;
  }

  return {
    uri,
    name: fileName,
    type: 'audio/m4a', // Or 'audio/mp4' for Android default
  };
};

// UPLOAD TO API (Example)
export const uploadToAPI = async (
  audioPath: string,
  apiUrl: string,
  onSuccess: (result: any) => void,
  onError: (err: any) => void,
) => {
  const file = getFileForUpload(audioPath);
  if (!file) return;

  const formData = new FormData();
  formData.append('audio', file);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const result = await response.json();
    onSuccess(result);
  } catch (err) {
    onError(err);
  }
};
