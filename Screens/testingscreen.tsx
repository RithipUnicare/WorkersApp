import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import initNotification from '../utils/pushNofication';
import { getLocation } from '../utils/GeoLocation';
import Sound, {
  AudioSet,
  RecordBackType,
  PlayBackType,
  PlaybackEndType,
} from 'react-native-nitro-sound';
import RNFS from 'react-native-fs';

const { width, height } = Dimensions.get('window');

const TestingScreen = () => {
  const [location, setLocation] = useState<string>('');
  const [recording, setRecording] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioPath, setAudioPath] = useState<string>('');
  const [recordTime, setRecordTime] = useState('00:00:00');
  const [playTime, setPlayTime] = useState('00:00:00');
  const [duration, setDuration] = useState('00:00:00');
  const [recordSecs, setRecordSecs] = useState(0);

  const requestPermissions = async () => {
    if (Platform.OS !== 'android') return true;
    const perms = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
    ]);
    return Object.values(perms).every(p => p === 'granted');
  };

  const startRecord = async () => {
    const ok = await requestPermissions();
    // if (!ok)
    //   return Alert.alert('Permission', 'Mic & storage permissions required');

    try {
      const fileName = `recording_${Date.now()}.m4a`;
      const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      const audioSet: AudioSet = {
        AudioSamplingRate: 44100,
        AudioEncodingBitRate: 64000,
        AudioChannels: 1,
      };

      Sound.addRecordBackListener((e: RecordBackType) => {
        setRecordSecs(e.currentPosition);
        setRecordTime(Sound.mmssss(Math.floor(e.currentPosition)));
      });

      await Sound.startRecorder(filePath, audioSet, true);
      setRecording(true);
    } catch (err) {
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecord = async () => {
    try {
      const uri = await Sound.stopRecorder();
      Sound.removeRecordBackListener();
      setRecording(false);
      setAudioPath(uri);
      setDuration(Sound.mmssss(Math.floor(recordSecs)));
    } catch (err) {
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const startPlay = async () => {
    if (!audioPath) return;

    try {
      Sound.addPlayBackListener((e: PlayBackType) => {
        setPlayTime(Sound.mmssss(Math.floor(e.currentPosition)));
        if (e.duration > 0) setDuration(Sound.mmssss(Math.floor(e.duration)));
      });

      Sound.addPlaybackEndListener(() => {
        setIsPlaying(false);
        setPlayTime('00:00:00');
      });

      await Sound.startPlayer(audioPath);
      setIsPlaying(true);
    } catch (err) {
      Alert.alert('Error', 'Failed to start playback');
    }
  };

  const stopPlay = async () => {
    try {
      await Sound.stopPlayer();
      Sound.removePlayBackListener();
      Sound.removePlaybackEndListener();
      setIsPlaying(false);
      setPlayTime('00:00:00');
    } catch (err) {
      Alert.alert('Error', 'Failed to stop playback');
    }
  };

  const GetgeoLocation = async () => {
    const location = await getLocation();
    setLocation(location?.address);
  };

  const uploadToAPI = async () => {
    if (!audioPath) return Alert.alert('No Audio', 'Record first');

    let uri = audioPath;
    if (Platform.OS === 'android' && !uri.startsWith('file://')) {
      uri = `file://${uri}`;
    }
    const fileName = audioPath.split('/').pop() || 'recording.m4a';
    const file = {
      uri,
      name: fileName,
      type: 'audio/m4a',
    };

    const formData = new FormData();
    formData.append('audio', file);

    try {
      const response = await fetch('https://your-api.com/upload', {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await response.json();
      Alert.alert('Success', 'Uploaded!');
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.body}>
        <TouchableOpacity style={styles.btn} onPress={GetgeoLocation}>
          <MaterialCommunityIcons name="map-marker" size={28} color="#fff" />
          <Text style={styles.btnText}>Get Geolocation</Text>
        </TouchableOpacity>
        {location ? <Text style={styles.result}>{location}</Text> : null}

        <TouchableOpacity
          style={styles.btn}
          onPress={recording ? stopRecord : startRecord}
        >
          <MaterialCommunityIcons
            name={recording ? 'stop-circle' : 'microphone'}
            size={28}
            color="#fff"
          />
          <Text style={styles.btnText}>
            {recording ? 'Stop Recording' : 'Start Recording'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.result}>{recordTime}</Text>

        {audioPath ? (
          <>
            <TouchableOpacity
              style={styles.btn}
              onPress={isPlaying ? stopPlay : startPlay}
            >
              <MaterialCommunityIcons
                name={isPlaying ? 'stop' : 'play'}
                size={28}
                color="#fff"
              />
              <Text style={styles.btnText}>
                {isPlaying ? 'Stop Playing' : 'Play Recording'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.result}>
              {playTime} / {duration}
            </Text>

            <TouchableOpacity style={styles.btn} onPress={uploadToAPI}>
              <MaterialCommunityIcons name="upload" size={28} color="#fff" />
              <Text style={styles.btnText}>Upload Audio</Text>
            </TouchableOpacity>
            <Text style={styles.result}>Path: {audioPath}</Text>
          </>
        ) : null}

        <TouchableOpacity style={styles.btn} onPress={initNotification}>
          <MaterialCommunityIcons name="bell-ring" size={28} color="#fff" />
          <Text style={styles.btnText}>Send Push Notification</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: width * 0.05,
    paddingVertical: height * 0.02,
    elevation: 2,
  },
  headerTitle: {
    marginLeft: width * 0.03,
    fontSize: width * 0.05,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  body: {
    flex: 1,
    padding: width * 0.05,
    alignItems: 'center',
  },
  btn: {
    flexDirection: 'row',
    backgroundColor: '#2874b8',
    width: width * 0.85,
    padding: height * 0.02,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: height * 0.015,
  },
  btnText: {
    marginLeft: 12,
    color: '#fff',
    fontSize: width * 0.045,
    fontWeight: '600',
  },
  result: {
    marginTop: height * 0.01,
    fontSize: width * 0.038,
    color: '#333',
    textAlign: 'center',
  },
});

export default TestingScreen;
