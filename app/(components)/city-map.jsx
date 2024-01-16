"use client";

import { useLayoutEffect, useMemo, useRef, useEffect } from "react";

// threeJS
import * as THREE from "three";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { KernelSize, Resolution } from "postprocessing";

// Library functions to handle map data
import { SceneObject, lineBaseSegment } from "@/lib/utilities/sceneUtils";
import { breadthFirstSearch } from "@/lib/algorithms/breadth-first-search";
import { depthFirstSearch } from "@/lib/algorithms/depth-first-search";
import { Graph } from "@/lib/graph";
import {
  generateSegmentProperties,
  calculateMapCenter,
} from "@/lib/utilities/mapUtils";

const CityMap = ({ parsedLineData }) => {
  // Define ref to update the lines
  const lineMeshRef = useRef();
  const glowingLineMeshRef = useRef();
  const cityGraph = useMemo(() => new Graph(), []);

  // Calculate the center of the map
  const center = useMemo(
    () => calculateMapCenter(parsedLineData),
    [parsedLineData]
  );

  const baseLayerScene = useMemo(
    () =>
      new SceneObject(
        0x83888c,
        0.0001,
        0,
        parsedLineData.length,
        generateSegmentProperties(parsedLineData, center, 0x83888c)
      ),
    [parsedLineData, center]
  );

  const topLayerScene = useMemo(
    () =>
      new SceneObject(
        0xffec3d,
        0.0002,
        0.00001,
        parsedLineData.length,
        generateSegmentProperties(parsedLineData, center, 0xffec3d)
      ),
    [parsedLineData, center]
  );

  // Convert city data into graph data structure
  useEffect(() => {
    cityGraph.setCenter(center.x, center.y);
    cityGraph.fillGraph(parsedLineData);
  }, [parsedLineData, cityGraph, center.x, center.y]);

  // Add lines to the threeJS scene
  useLayoutEffect(() => {
    baseLayerScene.updateScene(lineMeshRef, null, true);
    topLayerScene.updateScene(glowingLineMeshRef, cityGraph.edgeToIndex, false);
  }, [cityGraph, baseLayerScene, topLayerScene]);

  // Temporary function to test visual BFS, will be removed later
  useEffect(() => {
    depthFirstSearch(cityGraph, topLayerScene, glowingLineMeshRef);
  }, [cityGraph, topLayerScene]);

  return (
    <>
      <EffectComposer>
        <Bloom
          selection={glowingLineMeshRef}
          intensity={1.0} // The bloom intensity.
          kernelSize={KernelSize.LARGE} // blur kernel size
          luminanceThreshold={0.25} // luminance threshold. Raise this value to mask out darker elements in the scene.
          luminanceSmoothing={0.025} // smoothness of the luminance threshold. Range is [0, 1]
          mipmapBlur={false} // Enables or disables mipmap blur.
          resolutionX={Resolution.AUTO_SIZE} // The horizontal resolution.
          resolutionY={Resolution.AUTO_SIZE} // The vertical resolution.
        />
      </EffectComposer>

      <instancedMesh
        ref={lineMeshRef}
        args={[null, null, parsedLineData.length]}
      >
        <shapeGeometry args={[lineBaseSegment]} />
        <meshBasicMaterial
          attach="material"
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </instancedMesh>

      <instancedMesh
        ref={glowingLineMeshRef}
        args={[null, null, parsedLineData.length]}
      >
        <shapeGeometry args={[lineBaseSegment]} />
        <meshBasicMaterial
          attach="material"
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </instancedMesh>
    </>
  );
};

export default CityMap;
