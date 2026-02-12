import { reactive } from 'vue';

export interface DemoState {
  counter: number;
  color: string;
  sliderValue: number;
  text: string;
  revision: string;
}

export const store = reactive<DemoState>({
  counter: 0,
  color: '#3b82f6',
  sliderValue: 50,
  text: '',
  revision: '0',
});
