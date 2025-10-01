import { findByProps } from '@vendetta/metro';

const zustand = findByProps("create", "useStore");
export const { create } = zustand;
