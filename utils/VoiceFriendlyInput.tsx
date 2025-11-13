import React, { useState, useEffect } from 'react';
import { TextInput as PaperTextInput } from 'react-native-paper';

import type {
  NativeSyntheticEvent,
  TextInputChangeEventData,
} from 'react-native';

type Props = Omit<
  React.ComponentProps<typeof PaperTextInput>,
  'onChange' | 'onChangeText' | 'value'
> & {
  onChangeText?: (text: string) => void;
  onChange?: (e: NativeSyntheticEvent<TextInputChangeEventData>) => void;
  value?: string;
};

const VoiceFriendlyInput: React.FC<Props> = ({
  onChangeText,
  value,
  onChange,
  ...props
}: Props) => {
  const [internalValue, setInternalValue] = useState(value || '');

  useEffect(() => {
    setInternalValue(value || '');
  }, [value]);

  const handleChange = (e: NativeSyntheticEvent<TextInputChangeEventData>) => {
    const fullText = e.nativeEvent.text;
    setInternalValue(fullText);
    onChange?.(e);
    onChangeText?.(fullText);
  };

  return (
    <PaperTextInput
      {...props}
      value={internalValue}
      onChange={handleChange}
      onChangeText={undefined}
    />
  );
};

export default VoiceFriendlyInput;
