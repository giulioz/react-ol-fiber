import React from 'react';

export function DarkCanvasLayer() {
  return (
    <tileLayer arg={{ preload: 256 }}>
      <xYZSource
        arg={{ cacheSize: 256, url: 'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}' }}
      />
    </tileLayer>
  );
}
