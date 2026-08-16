/**
 * sw.js — MZ사주풀이 서비스워커
 * 전략: 캐시 우선(cache-first) + 네트워크 폴백, 실패한 GET은 캐시로 폴백
 * 버전을 올리면(CACHE_VERSION 변경) 이전 캐시는 activate 단계에서 자동 정리된다.
 */
var CACHE_VERSION = 'mz-saju-v3';

var CACHE_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './content-db.js',
  './saju-engine.js',
  './name-reader.js'
];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_VERSION).then(function(cache){
      // saju-engine.js 등 아직 존재하지 않는 파일이 있어도 전체 캐시가 실패하지 않도록
      // 파일별로 개별 처리한다.
      return Promise.all(CACHE_FILES.map(function(url){
        return cache.add(url).catch(function(){
          // 무시: 해당 파일이 아직 배포되지 않았을 수 있음
        });
      }));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(key){ return key !== CACHE_VERSION; })
            .map(function(key){ return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event){
  if(event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(function(cached){
      var networkFetch = fetch(event.request).then(function(response){
        if(response && response.status === 200 && response.type === 'basic'){
          var clone = response.clone();
          caches.open(CACHE_VERSION).then(function(cache){
            cache.put(event.request, clone);
          });
        }
        return response;
      }).catch(function(){
        return cached;
      });
      return cached || networkFetch;
    })
  );
});
