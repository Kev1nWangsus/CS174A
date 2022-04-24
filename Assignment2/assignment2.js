import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

class Cube extends Shape {
    constructor() {
        super("position", "normal",);
        // Loop 3 times (for each axis), and inside loop twice (for opposing cube sides):
        this.arrays.position = Vector3.cast(
            [-1, -1, -1], [1, -1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, -1], [-1, 1, -1], [1, 1, 1], [-1, 1, 1],
            [-1, -1, -1], [-1, -1, 1], [-1, 1, -1], [-1, 1, 1], [1, -1, 1], [1, -1, -1], [1, 1, 1], [1, 1, -1],
            [-1, -1, 1], [1, -1, 1], [-1, 1, 1], [1, 1, 1], [1, -1, -1], [-1, -1, -1], [1, 1, -1], [-1, 1, -1]);
        this.arrays.normal = Vector3.cast(
            [0, -1, 0], [0, -1, 0], [0, -1, 0], [0, -1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0],
            [-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0],
            [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, -1], [0, 0, -1], [0, 0, -1], [0, 0, -1]);
        // Arrange the vertices into a square shape in texture space too:
        this.indices.push(0, 1, 2, 1, 3, 2, 4, 5, 6, 5, 7, 6, 8, 9, 10, 9, 11, 10, 12, 13,
            14, 13, 15, 14, 16, 17, 18, 17, 19, 18, 20, 21, 22, 21, 23, 22);
    }
}

class Cube_Outline extends Shape {
    constructor() {
        super("position", "color");
        // When a set of lines is used in graphics, you should think of the list entries as
        // broken down into pairs; each pair of vertices will be drawn as a line segment.
        // Note: since the outline is rendered with Basic_shader, you need to redefine the position and color of each vertex
        this.arrays.position = Vector3.cast([-1, -1, -1], [1, -1, -1],
                [-1, -1, -1], [-1, 1, -1],
                [-1, -1, -1], [-1, -1, 1],
                [-1, 1, 1], [-1, 1, -1],
                [-1, 1, 1], [-1, -1, 1],
                [-1, 1, 1], [1, 1, 1],
                [1, 1, 1], [1, 1, -1],
                [1, 1, 1], [1, -1, 1],
                [1, 1, -1], [-1, 1, -1],
                [1, 1, -1], [1, -1, -1],
                [1, -1, 1], [-1, -1, 1],
                [1, -1, 1], [1, -1, -1]);
        this.arrays.color = [...Array(24)].map(x => color(1, 1, 1, 1));
        this.indices = false;
    }
}

class Cube_Single_Strip extends Shape {
    constructor() {
        super("position", "normal");
        this.arrays.position = Vector3.cast(
            [-1, 1, 1], [1, 1, 1],
            [-1, -1, 1], [1, -1, 1],
            [-1, 1, -1], [1, 1, -1],
            [-1, -1, -1], [1, -1, -1]);
        this.arrays.normal = [...this.arrays.position];
        this.indices = [
            0, 1, 2,
            1, 2, 3,
            0, 4, 6,
            0, 2, 6,
            0, 4, 5,
            0, 1, 5,
            2, 3, 6,
            3, 7, 6,
            1, 5, 7,
            1, 3, 7,
            4, 5, 7,
            4, 6, 7,
        ];

    }
}


class Base_Scene extends Scene {
    /**
     *  **Base_scene** is a Scene that can be added to any display canvas.
     *  Setup the shapes, materials, camera, and lighting here.
     */
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();
        this.hover = this.swarm = false;
        // At the beginning of our program, load one of each of these shape definitions onto the GPU.
        this.shapes = {
            'cube': new Cube(),
            'outline': new Cube_Outline(),
            'triangle_strip': new Cube_Single_Strip()
        };
        this.flag = false;
        this.outline_flag = false;
        // light color
        this.colors = [...Array(8)].map(x => color(0.5*Math.random()+0.5, 0.5*Math.random()+0.5, 0.5*Math.random()+0.5, 1));
        // *** Materials
        this.materials = {
            plastic: new Material(new defs.Phong_Shader(),
                {ambient: .4, diffusivity: .6, color: hex_color("#ffffff")}),
        };
        // The white material and basic shader are used for drawing the outline.
        this.white = new Material(new defs.Basic_Shader());
    }

    display(context, program_state) {
        // display():  Called once per frame of animation. Here, the base class's display only does
        // some initial setup.

        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(Mat4.translation(5, -10, -30));
        }
        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, 1, 100);

        // *** Lights: *** Values of vector or point lights.
        const light_position = vec4(0, 5, 5, 1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];
    }
}

export class Assignment2 extends Base_Scene {
    /**
     * This Scene object can be added to any display canvas.
     * We isolate that code so it can be experimented with on its own.
     * This gives you a very small code sandbox for editing a simple scene, and for
     * experimenting with matrix transformations.
     */
    set_colors() {
        this.colors = this.colors.map(x => color(0.5*Math.random()+0.5, 0.5*Math.random()+0.5, 0.5*Math.random()+0.5, 1));
    }

    make_control_panel() {
        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
        this.key_triggered_button("Change Colors", ["c"], this.set_colors);
        // Add a button for controlling the scene.
        this.key_triggered_button("Outline", ["o"], () => {
            this.outline_flag = !this.outline_flag;
        });
        this.key_triggered_button("Sit still", ["m"], () => {
            this.flag = !this.flag;
        });
    }

    draw_box(context, program_state, model_transform, angle, index, type) {
        // model_transform = model_transform.times(Mat4.translation(0, 2, 0));

        // model_transform = model_transform.times(Mat4.translation(0, 2, 0))
        //     .times(Mat4.translation(-1, -1, 0))
        //     .times(Mat4.rotation(angle, 0, 0, 1))
        //     .times(Mat4.translation(1, 1, 0));

        // translate up 2 units
        // rotate
        // scale after rotation to avoid shearing
        model_transform = model_transform.times(Mat4.translation(-1, 1.5, 0))
            .times(Mat4.rotation(angle, 0, 0, 1))
            .times(Mat4.translation(1, 1.5, 0))
            .times(Mat4.scale(1, 1.5, 1))

        if (type === 0) {
            this.shapes.cube.draw(context, program_state, model_transform,
                this.materials.plastic.override({color: this.colors[index]}));
        }
        if (type === 1) {
            this.shapes.outline.draw(context, program_state, model_transform, this.white, "LINES");
        }
        if (type === 2) {
            this.shapes.triangle_strip.draw(context, program_state, model_transform,
                this.materials.plastic.override({color: this.colors[index]}), "TRIANGLE_STRIP");
        }

        // scale back
        model_transform = model_transform.times(Mat4.scale(1, 1/1.5, 1))
        return model_transform;


    }

    display(context, program_state) {
        super.display(context, program_state);
        const blue = hex_color("#1a9ffa");
        let model_transform = Mat4.identity();

        const max_angle = 0.04*Math.PI;
        const t = this.t = program_state.animation_time / 1000;
        const speed = 0.25;
        let angle = max_angle/2 + max_angle/2 * Math.sin(speed * Math.PI * t);
        // Example for drawing a cube, you can remove this line if needed

        if (!this.flag) {
            angle = max_angle;
        }

        // place the cube a little lower
        model_transform = model_transform.times(Mat4.translation(0, -3, 0))
        for (let i = 0; i < 8; i++) {
            if (i === 0) {
                if (this.outline_flag) {
                    model_transform = this.draw_box(context, program_state, model_transform, 0, -1, 1);
                } else {
                    model_transform = this.draw_box(context, program_state, model_transform, 0, i, 2);
                }
            } else {
                if (this.outline_flag) {
                    model_transform = this.draw_box(context, program_state, model_transform, angle, -1, 1);
                } else {
                    if (i % 2 === 0) model_transform = this.draw_box(context, program_state, model_transform, angle, i, 2);
                    else model_transform = this.draw_box(context, program_state, model_transform, angle, i, 0)
                }
            }
        }
    }
}