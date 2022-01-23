import React from 'react';

export function DarkCanvasLayer() {
  return (
    <tileLayer>
      <xYZSource arg={{ url: 'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}' }} />
    </tileLayer>
  );
}
