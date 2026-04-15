"use client";

import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Stage, Html } from "@react-three/drei";
import { Suspense, useState } from "react";
import { STLLoader } from "three-stdlib";

// Загрузчик
function Model({ url, color, position, rotation }: { url: string, color: string, position: [number, number, number], rotation: [number, number, number] }) {
  const geom = useLoader(STLLoader, url);
  return (
    <group position={position} rotation={rotation}>
      <mesh geometry={geom} castShadow receiveShadow>
        <meshStandardMaterial color={color} roughness={0.7} metalness={0.1} />
      </mesh>
    </group>
  );
}

// Красивая группа ползунков (Теперь светлая)
function SliderGroup({ title, pos, setPos, rot, setRot }: any) {
  const updatePos = (i: number, val: string) => { const n = [...pos]; n[i] = Number(val); setPos(n); };
  const updateRot = (i: number, val: string) => { const n = [...rot]; n[i] = Number(val); setRot(n); };

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm mb-4">
      <h4 className="text-[#1B3A5C] font-bold mb-4">{title}</h4>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">
            <span>Влево/Вправо (X)</span>
            <span className="text-[#2D7A4F]">Высота (Y)</span>
            <span>Вперед/Назад (Z)</span>
          </div>
          <div className="flex gap-4">
            {pos.map((v: number, i: number) => (
              <div key={i} className="w-1/3 flex flex-col items-center">
                <input type="range" min="-20000" max="20000" step="100" value={v} onChange={(e) => updatePos(i, e.target.value)} className="w-full accent-[#2D7A4F]" />
                <span className="text-xs text-gray-500 font-medium mt-1">{v}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">Вращение (Вокруг осей X, Y, Z):</p>
          <div className="flex gap-4">
            {rot.map((v: number, i: number) => (
              <div key={i} className="w-1/3 flex flex-col items-center">
                <input type="range" min="-3.14" max="3.14" step="1.57" value={v} onChange={(e) => updateRot(i, e.target.value)} className="w-full accent-[#2D7A4F]" />
                <span className="text-xs text-gray-500 font-medium mt-1">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function House3DViewer() {
  const [fPos, setFPos] = useState([0, 0, 0]); const [fRot, setFRot] = useState([-1.57, 0, 0]);
  const [wPos, setWPos] = useState([0, 3000, 0]); const [wRot, setWRot] = useState([-1.57, 0, 0]);
  const [rPos, setRPos] = useState([0, 6000, 0]); const [rRot, setRRot] = useState([-1.57, 0, 0]);

  return (
    // ГЛАВНЫЙ КОНТЕЙНЕР: Разделен на 2 колонки (Flexbox)
    <div className="flex flex-col lg:flex-row gap-8 w-full h-[750px]">
      
      {/* ЛЕВАЯ КОЛОНКА: Панель управления (отдельно от окна) */}
      <div className="w-full lg:w-1/3 h-full flex flex-col overflow-y-auto pr-2 custom-scrollbar">
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl mb-6">
          <p className="text-sm text-blue-800 font-medium">
            Подгоните детали дома друг к другу. Обратите внимание на ползунок <b>"Высота (Y)"</b>. Как только соберете дом, нажмите синюю кнопку внизу.
          </p>
        </div>

        <SliderGroup title="1. Фундамент" pos={fPos} setPos={setFPos} rot={fRot} setRot={setFRot} />
        <SliderGroup title="2. Стены (3D Печать)" pos={wPos} setPos={setWPos} rot={wRot} setRot={setWRot} />
        <SliderGroup title="3. Крыша" pos={rPos} setPos={setRPos} rot={rRot} setRot={setRRot} />
        
        {/* Кнопка в самом низу панели */}
        <button 
          onClick={() => alert(`Скопируйте это в чат:\n\nФундамент: Pos [${fPos}], Rot [${fRot}]\nСтены: Pos [${wPos}], Rot [${wRot}]\nКрыша: Pos [${rPos}], Rot [${rRot}]`)}
          className="w-full bg-[#1B3A5C] text-white font-bold py-4 rounded-xl hover:bg-blue-800 transition-all mt-auto shadow-lg shadow-blue-900/20"
        >
          Узнать точные координаты
        </button>
      </div>

      {/* ПРАВАЯ КОЛОНКА: Чистое 3D-Окно */}
      <div className="w-full lg:w-2/3 h-full relative bg-slate-900 rounded-[40px] overflow-hidden shadow-2xl border-4 border-white">
        <div className="absolute top-6 left-6 z-10 bg-black/50 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-bold border border-white/10">
          Вращайте дом мышью
        </div>

        <Canvas shadows camera={{ position: [20000, 15000, 20000], fov: 45 }}>
          <Suspense fallback={<Html center><div className="text-white font-bold">Загрузка гигантской модели...</div></Html>}>
            <Stage environment="city" intensity={0.6}>
              <Model url="/fund.stl" color="#9ca3af" position={fPos as any} rotation={fRot as any} /> 
              <Model url="/walls-a.stl" color="#f3f4f6" position={wPos as any} rotation={wRot as any} />
              <Model url="/walls-b.stl" color="#f3f4f6" position={wPos as any} rotation={wRot as any} />
              <Model url="/walls-c.stl" color="#f3f4f6" position={wPos as any} rotation={wRot as any} />
              <Model url="/roof.stl" color="#374151" position={rPos as any} rotation={rRot as any} />
            </Stage>
          </Suspense>
          <OrbitControls makeDefault />
        </Canvas>
      </div>

    </div>
  );
}