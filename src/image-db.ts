/*
  Copyright 2017 Google Inc. All Rights Reserved.
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
      http://www.apache.org/licenses/LICENSE-2.0
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

const DB_VERSION = 1;

class ImageDB {
  private dbPromise: Promise<IDBDatabase>;
  private dbResolve: Function;
  private dbReject: Function;

  constructor() {
    const request = indexedDB.open('image-db', DB_VERSION);

    this.dbPromise = new Promise((resolve, reject) => {
      this.dbResolve = resolve;
      this.dbReject = reject;

      request.onerror = (reason) => this.dbReject(reason);
      request.onupgradeneeded = (event) => this.createObjectStore(event);
      request.onsuccess = (event) => this.dbOpened(request);
    });
  }

  store(image: Blob): Promise<number> {
    const promise = new Promise((resolve, reject) => {
      this.dbPromise.then((db) => {
        const transaction = db.transaction(['images'], 'readwrite');
        const put = transaction.objectStore('images').put(image);

        put.onsuccess = (event) => resolve(put.result);
        put.onerror = reject;
      }).catch(reject);
    });

    return promise;
  }

  retrieve(id: number): Promise<Blob> {
    const promise = new Promise((resolve, reject) => {
      this.dbPromise.then((db) => {
        const transaction = db.transaction(['images'], IDBTransaction.READ_ONLY);
        const get = transaction.objectStore('images').get(id);

        get.onsuccess = (event) => resolve(get.result);
        get.onerror = reject;
      }).catch(reject);
    });

    return promise;
  }

  private dbOpened(request: IDBOpenDBRequest) {
    this.dbResolve(request.result);
    this.dbPromise.then((db) => {
      db.onerror = (reason) => this.error(reason);
    });
  }

  private error(reason) {
    console.error(reason);
  }

  private createObjectStore(event) {
    event.target.result.createObjectStore('images', {autoIncrement: true});
  }
}

export default new ImageDB();
