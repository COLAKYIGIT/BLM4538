import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Button, Alert } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import EditableItem from './EditableItem';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DeviceScreen({ deviceId, options, persistentId, refreshDevices }) {
  // const {deviceId, options} = route.params;
  const [data, setData] = useState([]);
  const [plantData, setplantData] = useState([{ id: '1', name: 'None' }]);
  const [loading, setLoading] = useState(true); // Yükleniyor durumu
  // const options = ['Boş', 'Marul', 'Domates', 'Salatalık', 'Biber'];

  const deleteDevice = async () => {
    const storedDevices = await AsyncStorage.getItem('devices_list');
    const devices = storedDevices ? JSON.parse(storedDevices) : [];
    console.log(devices);
    const updatedDevices = devices.filter(device => device.id !== deviceId);
    console.log(updatedDevices)
  
    await AsyncStorage.setItem('devices_list', JSON.stringify(updatedDevices));
    const doc = firestore().collection('devices').doc(deviceId).collection('users').doc('users_list')
    doc.set({
      [persistentId]: ''
    }, { merge: true });
    Alert.alert('Başarılı', 'Cihaz başarıyla silindi.');
    refreshDevices();
  }
  
  console.log(deviceId);
  console.log("options_received:",options);
  if (!options || options.length === 0) {
    console.log("trap");
    return (
      <View>
        <Text>Yükleniyor... (ya da seçenek yok)</Text>
      </View>
    );
  }

  useEffect(() => {
    console.log("useEffect çalıştırıldı.");

    // Firestore'dan gerçek zamanlı veriyi dinle
    const getSensorData = firestore()
      .collection("devices")
      .doc(deviceId)
      .collection("data")
      .doc("sensor_data")
      .onSnapshot(snapshot => {
        if (snapshot.exists) {
          const rawData = snapshot.data();
          const formattedData = Object.keys(rawData).map(key => {
            const value = rawData[key];
            const formattedValue = key === 'tarih' && value
              ? new Date(value._seconds * 1000).toLocaleString()
              : value;

            return {
              id: key,
              name: key,
              value: formattedValue,
            };
          });
          console.log(formattedData);
          setData(formattedData);
          console.log(data);
        }
      });
    const getPlantName = firestore()
      .collection("devices")
      .doc(deviceId)
      .collection("data")
      .doc("device_data")
      .onSnapshot(snapshot => {
        if (snapshot.exists) {
          const data = snapshot.data();
          const plantName = data?.plant_name || 'None';
          setplantData(prevData =>
            prevData.map(item =>
              item.id === '1' ? { ...item, name: plantName } : item
            )
          );

          setLoading(false); // Veriler yüklendi
        }
      });

    // Component unmount edildiğinde dinleyicileri temizle
    return () => {
      getSensorData();
      getPlantName();
    };

  }, [deviceId]);

  const renderItem = ({ item }) => (
    <View style={styles.box}>
      <Text style={styles.title}>{item.name}</Text>
      <Text>{item.value}</Text>
    </View>
  );

  const handleConfirm = async (id, newValue) => {
    console.log("handle confirm çalıştı");
  
    // UI verisini güncelle
    setData(prev =>
      prev.map(item =>
        item.id === id ? { ...item, name: newValue } : item
      )
    );
  
    try {
      // Firestore'a plant_name güncelle
      await firestore()
      .collection("devices")
      .doc(deviceId)
      .collection("data")
      .doc("device_data")
      .set({
        plant_name: newValue,
        start_date: firestore.FieldValue.serverTimestamp(),
        update_date: firestore.FieldValue.serverTimestamp()
      }, { merge: true });
  
      console.log('bitkiadi başarıyla güncellendi veya oluşturuldu!');
  
      // sensor_data alanlarını temizle
      const sensorDataRef = firestore()
        .collection("devices")
        .doc(deviceId)
        .collection("data")
        .doc("sensor_data");
  
      const sensorDataDoc = await sensorDataRef.get();
  
      if (sensorDataDoc.exists) {
        const data = sensorDataDoc.data();
        const clearedFields = {};
  
        for (const key in data) {
          clearedFields[key] = null; // veya "" koyabilirsin
        }
  
        await sensorDataRef.update(clearedFields);
        console.log("Sensor verileri temizlendi.");
      }
    } catch (error) {
      console.error('Hata:', error);
    }
  };
  
  const renderEditableItem = ({ item }) => (
    <EditableItem
      value={item.name}
      options={options}
      onConfirm={(newValue) => handleConfirm(item.id, newValue)}
    />
  );

  return (
    <View style={styles.container}>
      {loading ? ( 
        <>
          <Text>Yükleniyor...</Text>
          <Button title="Cihazı Sil" onPress={deleteDevice} />
        </>
      ) : (
        <>
          <FlatList
            data={plantData}
            keyExtractor={item => item.id}
            renderItem={renderEditableItem}
          />
          <FlatList
            data={data}
            keyExtractor={item => item.id}
            numColumns={3}
            contentContainerStyle={styles.container}
            renderItem={renderItem}
          />
          <Button title="Cihazı Sil" onPress={deleteDevice} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  box: {
    flex: 1,
    margin: 5,
    padding: 10,
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 100,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
});
