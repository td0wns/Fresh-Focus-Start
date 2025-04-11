export async function isWordValid(word) {
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`);
    if (!res.ok) return false;
    const data = await res.json();
    return Array.isArray(data);
  } catch (err) {
    console.error("Word validation failed", err);
    return false;
  }
}
