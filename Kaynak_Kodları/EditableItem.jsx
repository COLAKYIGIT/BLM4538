// EditableItem.js

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';

const EditableItem = ({ value, options, onConfirm }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  console.log("editable'da tempValue");
  console.log(tempValue);

  const handleEdit = () => setIsEditing(true);
  const handleCancel = () => {
    setTempValue(value);
    setIsEditing(false);
  };
  const handleConfirm = () => {
    console.log("editable handle confirm çalıştı");
    onConfirm(tempValue);
    setIsEditing(false);
  };

  return (
    <View style={styles.container}>
      {isEditing ? (
        <>
          <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
            <Text style={styles.buttonText}>✖</Text>
          </TouchableOpacity>

          <Picker
            selectedValue={tempValue}
            style={styles.picker}
            onValueChange={(itemValue) => setTempValue(itemValue)}
            >
            {options.map(option => (
                <Picker.Item key={option} label={option} value={option} />
            ))}
          </Picker>

          <TouchableOpacity onPress={handleConfirm} style={styles.confirmButton}>
            <Text style={styles.buttonText}>✔</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.label}>{tempValue}</Text>
          <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
            <Text style={styles.buttonText}>✎</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  label: { fontSize: 16, marginRight: 8 },
  editButton: { padding: 6 },
  cancelButton: { padding: 6, backgroundColor: '#f66', marginRight: 4 },
  confirmButton: { padding: 6, backgroundColor: '#6f6', marginLeft: 4 },
  picker: { height: 50, flex: 1 },
  buttonText: { fontSize: 16 },
});

export default EditableItem;