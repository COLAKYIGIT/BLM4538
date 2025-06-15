import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import DeviceScreen from './DeviceScreen';
import uuid from 'react-native-uuid';
import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AddDeviceScreen from './AddDeviceScreen';

const Drawer = createDrawerNavigator();

// const devices = [
//   { name: 'Cihaz 1', id: 'device1' },
//   { name: 'Cihaz 2', id: 'device2' },
//   { name: 'Cihaz 3', id: 'device3' },
// ];

const getPersistentAppId = async () => {
  try {
    let appId = await AsyncStorage.getItem('persistent_app_id');
    if (!appId) {
      appId = uuid.v4();
      await AsyncStorage.setItem('persistent_app_id', appId);
    }
    return appId;
  } catch (error) {
    console.error('Persistent App Id AsyncStorage Hatası:', error);
    return null;
  }
};

const getOldToken = async () => {
  try {
    let oldToken = await AsyncStorage.getItem('old_token');
    return oldToken;
  } catch (error) {
    console.error('Old Token AsyncStorage Hatası:', error);
    return null;
  }
};

const getOptionsFromFirestore = async () => {
  try {
    const doc = await firestore()
      .collection("avaliable_plants")
      .doc("avaliable_plants_doc")
      .get();

    if (doc.exists) {
      const data = doc.data();
      return data.avaliable_plants_list;
    } else {
      console.warn("Belge bulunamadı.");
      return [];
    }
  } catch (error) {
    console.error('Firestore Options Çekme Hatası:', error);
    return [];
  }
};

export default function App() {
  const [options, setOptions] = useState([]);
  const [isReady, setIsReady] = useState(false); // hem token işleri hem options hazır mı
  const [devices, setDevices] = useState([]);
  const [initialRoute, setInitialRoute] = useState(null);
  const [persistentId, setPersistentId] = useState(null);

  const fetchDevices = async () => {
    const storedDevicesRaw = await AsyncStorage.getItem('devices_list');
    const storedDevices = storedDevicesRaw ? JSON.parse(storedDevicesRaw) : [];
    setDevices(storedDevices);
    if (storedDevices.length > 0){
      setInitialRoute(storedDevices[0].name);
    }
  }
  useEffect(() => {
    fetchDevices();
  }, []);

  useEffect(() => {
    const init = async () => {
      const id = await getPersistentAppId();
      setPersistentId(id);
      // const oldToken = await getOldToken();

      const plants = await getOptionsFromFirestore();
      console.log("Firestore'dan gelen plants:", plants);
      setOptions(plants); // State asenkron olarak güncellenir

      try {
        const newToken = await messaging().getToken();
        console.log('FCM Token:', newToken);

        const batch = firestore().batch();

        for (const device of devices) {
          const deviceRef = firestore().collection('devices').doc(device.id);
          await deviceRef.set({}, { merge: true });
          const userRef = deviceRef.collection('users').doc('users_list');
          batch.set(userRef, { [id]: newToken }, { merge: true });
        }

        await batch.commit();
        // await AsyncStorage.setItem('old_token', newToken);
        console.log('FCM token Firestore\'a başarıyla gönderildi.');

      } catch (error) {
        if (error instanceof Error) {
          console.log('FCM token alırken hata oluştu:', error.message);
          console.log(error.stack);
        } else {
          console.log('FCM token alırken hata oluştu (non-Error türü):', JSON.stringify(error));
        }
      }

      setIsReady(true); // Hem options hem diğer işler hazır
    };

    init();
  }, [devices]);

  if (!isReady || options.length === 0) {
    return null; // options henüz yüklenmediyse hiçbir şey gösterme
  }

  return (
    <NavigationContainer>
      <Drawer.Navigator initialRouteName={initialRoute}>
        {devices.map(device => {
          console.log(`Drawer için gönderilen options (${device.name}):`, options);
          return (
            <Drawer.Screen
              key={device.id}
              name={device.name}
            >
              {props => (
                <DeviceScreen
                  {...props}
                  deviceId={device.id}
                  options={options}
                  persistentId={persistentId}
                  refreshDevices={fetchDevices} // Burada fonksiyonu prop olarak veriyoruz
                />
              )}
            </Drawer.Screen>
          );
        })}
        <Drawer.Screen
          name="Cihaz Ekle"
          children={() => <AddDeviceScreen refreshDevices={fetchDevices} />}
        />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}