import {
  makeRequest,
  ANIMATED_MORPH_CUBE,
  saveTestImage,
  IRIDESCENT_DISH_WITH_OLIVES,
  HDRI,
} from "../helpers";

describe("Batch Render Endpoint", () => {
  it("should render a batch of 2 frames with different settings", async () => {
    const result = await makeRequest("/batch", {
      model: ANIMATED_MORPH_CUBE,
      frames: [
        { width: 300, height: 300 },
        { pitch: 90, outputFormat: "png" },
      ],
    });

    expect(result.status).toBe(200);
    expect(result.data.success).toBe(true);
    expect(result.data.images).toHaveLength(2);

    // Frame 0
    expect(result.data.images[0].image).toMatch(/^data:image\/webp;base64,/);
    saveTestImage("batch-2/batch_frame_0.webp", result.data.images[0].image);

    // Frame 1
    expect(result.data.images[1].image).toMatch(/^data:image\/png;base64,/);
    saveTestImage("batch-2/batch_frame_1.png", result.data.images[1].image);
  }, 120000);

  it("should render a complex batch of 4 frames", async () => {
    const result = await makeRequest("/batch", {
      model: IRIDESCENT_DISH_WITH_OLIVES,
      frames: [
        { background: "#00FF00" },
        { skybox: HDRI },
        {
          scaleX: 2,
          scaleY: 2,
          scaleZ: 2,
          outputFormat: "png",
          skyboxColor: "radial-gradient(circle, #ffffff, #00abff)",
        },
        { shadowIntensity: 1, outputFormat: "avif", quality: 10 },
      ],
    });

    expect(result.status).toBe(200);
    expect(result.data.success).toBe(true);
    expect(result.data.images).toHaveLength(4);

    // Frame 0
    expect(result.data.images[0].image).toMatch(/^data:image\/webp;base64,/);
    saveTestImage("batch-4/batch_frame_0.webp", result.data.images[0].image);

    // Frame 1
    expect(result.data.images[1].image).toMatch(/^data:image\/webp;base64,/);
    saveTestImage("batch-4/batch_frame_1.webp", result.data.images[1].image);

    // Frame 2
    expect(result.data.images[2].image).toMatch(/^data:image\/png;base64,/);
    saveTestImage("batch-4/batch_frame_2.png", result.data.images[2].image);

    // Frame 3
    expect(result.data.images[3].image).toMatch(/^data:image\/avif;base64,/);
    saveTestImage("batch-4/batch_frame_3.avif", result.data.images[3].image);
  }, 240000);
});
