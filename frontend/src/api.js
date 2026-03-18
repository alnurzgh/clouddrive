const BASE = 'http://localhost:8000/api/v1';

export async function uploadFile(file, onProgress) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', file.name);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status === 201) resolve(JSON.parse(xhr.responseText));
      else reject(new Error(`Ошибка загрузки: ${xhr.status}`));
    };

    xhr.onerror = () => reject(new Error('Сетевая ошибка'));
    xhr.open('POST', `${BASE}/files/upload/`);
    xhr.send(formData);
  });
}

export async function getFiles(folder = null) {
  const url = folder ? `${BASE}/files/?folder=${folder}` : `${BASE}/files/`;
  const res = await fetch(url);
  return res.json();
}

export async function deleteFile(id) {
  return fetch(`${BASE}/files/${id}/`, { method: 'DELETE' });
}

export async function getDownloadUrl(id) {
  const res = await fetch(`${BASE}/files/${id}/download/`);
  return res.json();
}