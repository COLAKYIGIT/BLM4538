import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AddDeviceScreen = ({refreshDevices}) => {
  const [deviceId, setDeviceId] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddDevice = async () => {
    if (deviceId.trim() === '' || deviceName.trim() === '') {
      Alert.alert('Hata', 'Cihaz id ve adı boş olamaz.');
      return;
    }

    setIsAdding(true);

    try {
      // Yeni cihaz için ID ve ad kullanarak cihaz oluştur
      const newDevice = {
        id: deviceId,  // Kullanıcının girdiği ID
        name: deviceName, // Kullanıcının girdiği cihaz adı
      };

      // Yeni cihazı AsyncStorage'a ekle
      const storedDevices = await AsyncStorage.getItem('devices_list');
      const devices = storedDevices ? JSON.parse(storedDevices) : [];
      const isDuplicateId = devices.some(device => device.id === newDevice.id);
      const isDuplicateName = devices.some(device => device.name === newDevice.name);
      if (isDuplicateId)  {
        Alert.alert('Hata', 'Bu id ile zaten bir cihaz eklenmiş.');
        setDeviceId('');
        setDeviceName('');
        return;
      }
      else if (isDuplicateName)  {
        Alert.alert('Hata', 'Bu ad ile zaten bir cihaz eklenmiş.');
        setDeviceId('');
        setDeviceName('');
        return;
      }

      devices.push(newDevice);

      // Yeni cihazları AsyncStorage'a kaydet
      await AsyncStorage.setItem('devices_list', JSON.stringify(devices));

      // Başarılı ekleme mesajı
      Alert.alert('Başarılı', 'Cihaz başarıyla eklendi.');

      refreshDevices();

      // Ekranı güncelle
      setDeviceId('');
      setDeviceName('');

    } catch (error) {
      console.error('Cihaz eklerken hata oluştu:', error);
      Alert.alert('Hata', 'Cihaz eklenirken bir hata oluştu.');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <View style={styles.container}>
      
      <TextInput
        style={styles.input}
        placeholder="Cihaza ad veriniz"
        value={deviceName}
        onChangeText={text => setDeviceName(text)}
      />

      <TextInput
        style={styles.input}
        placeholder="Cihaz Id'sini giriniz"
        value={deviceId}
        onChangeText={text => setDeviceId(text)}
      />
      
      <Button
        title={isAdding ? 'Ekleniyor...' : 'Cihaz Ekle'}
        onPress={handleAddDevice}
        disabled={isAdding} // Cihaz eklenirken butonu devre dışı bırak
      />

      {isAdding && <Text>Ekleniyor...</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingLeft: 10,
    marginBottom: 20,
  },
});

export default AddDeviceScreen;
