import { ref, watch } from 'vue';

export const isDarkMode = ref(true);

if (typeof document !== 'undefined') {
  document.documentElement.classList.toggle('dark', isDarkMode.value);
  document.body.classList.toggle('dark', isDarkMode.value);
}

watch(isDarkMode, val => {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', val);
    document.body.classList.toggle('dark', val);
  }
});

export const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value;
};
