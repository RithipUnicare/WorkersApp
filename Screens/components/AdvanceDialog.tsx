import React from 'react';
import { View } from 'react-native';
import { Portal, Dialog, TextInput, Button } from 'react-native-paper';

export type AdvanceDialogProps = {
  visible: boolean;
  amount: string;
  onAmountChange: (value: string) => void;
  onSkip: () => void;
  onSave: () => void;
  t: (key: string) => string;
  dialogInputStyle: any;
};

const AdvanceDialog: React.FC<AdvanceDialogProps> = ({
  visible,
  amount,
  onAmountChange,
  onSkip,
  onSave,
  t,
  dialogInputStyle,
}) => {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onSkip}>
        <Dialog.Title>{t('Edit Advance Payment')}</Dialog.Title>
        <Dialog.Content>
          <TextInput
            label={t('Advance Amount')}
            value={amount}
            onChangeText={onAmountChange}
            mode="outlined"
            keyboardType="numeric"
            style={dialogInputStyle}
            left={<TextInput.Affix text="₹" />}
          />
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onSkip}>{t('Skip')}</Button>
          <Button onPress={onSave} disabled={!amount}>
            {t('Save')}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

export default AdvanceDialog;
