import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture,
} = tiny;

const {Cube, Axis_Arrows, Textured_Phong} = defs

export class Assignment4 extends Scene {
    /**
     *  **Base_scene** is a Scene that can be added to any display canvas.
     *  Setup the shapes, materials, camera, and lighting here.
     */
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();

        // TODO:  Create two cubes, including one with the default texture coordinates (from 0 to 1), and one with the modified
        //        texture coordinates as required for cube #2.  You can either do this by modifying the cube code or by modifying
        //        a cube instance's texture_coords after it is already created.
        this.shapes = {
            box_1: new Cube(),
            box_2: new Cube(),
            axis: new Axis_Arrows()
        }
        this.stop = false;
        this.angle1 = 0;
        this.angle2 = 0;
        console.log(this.shapes.box_1.arrays.texture_coord)
        // shrink image size by 50%
        this.shapes.box_2.arrays.texture_coord = this.shapes.box_2.arrays.texture_coord.map(vec => Vector.of(vec[0]*2, vec[1]*2) );
        console.log(this.shapes.box_2.arrays.texture_coord)


        // TODO:  Create the materials required to texture both cubes with the correct images and settings.
        //        Make each Material from the correct shader.  Phong_Shader will work initially, but when
        //        you get to requirements 6 and 7 you will need different ones.
        this.materials = {
            phong: new Material(new Textured_Phong(), {
                color: hex_color("#ffffff"),
            }),
            texture_1: new Material(new Texture_Rotate(), {
                color: color(0, 0, 0, 1),
                ambient: 1, diffusivity: .1, specularity: .0,
                texture: new Texture("assets/stars.png", "NEAREST") // Texture class
            }),
            texture_2: new Material(new Texture_Scroll_X(), {
                color: color(0, 0, 0, 1),
                ambient: 1, diffusivity: .1, specularity: .0,
                texture: new Texture("assets/earth.gif", "LINEAR_MIPMAP_LINEAR")
            }),
        }

        this.initial_camera_location = Mat4.look_at(vec3(0, 10, 20), vec3(0, 0, 0), vec3(0, 1, 0));
    }

    make_control_panel() {
        // TODO:  Implement requirement #5 using a key_triggered_button that responds to the 'c' key.
        this.key_triggered_button("Toggle Rotation", ["c"],
            () => this.stop = !this.stop );
    }

    display(context, program_state) {
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(Mat4.translation(0, 0, -8));
        }

        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, 1, 100);

        const light_position = vec4(10, 10, 10, 1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];

        let t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;
        let model_transform = Mat4.identity();

        if (!this.stop) {
            // cube 1: 20rpm
            // 20 * 2pi / 60 = 2/3 * pi rad/s
            this.angle1 += dt * Math.PI * 2/3;
            // cube 2: 30rpm
            // 30 * 2pi / 60 = pi rad/s
            this.angle2 += dt * Math.PI;
        }
        // TODO:  Draw the required boxes. Also update their stored matrices.
        let cube1_model_transform = Mat4.identity()
            .times(Mat4.translation(-2, 0, 0))
            .times(Mat4.rotation(this.angle1, 1, 0, 0));
        this.shapes.box_1.draw(context, program_state, cube1_model_transform, this.materials.texture_1);

        let cube2_model_transform = Mat4.identity()
            .times(Mat4.translation(2, 0, 0))
            .times(Mat4.rotation(this.angle2, 0, 1, 0));
        this.shapes.box_2.draw(context, program_state, cube2_model_transform, this.materials.texture_2);
        // You can remove the following line.
        // this.shapes.axis.draw(context, program_state, model_transform, this.materials.phong.override({color: hex_color("#ffff00")}));
    }
}


class Texture_Scroll_X extends Textured_Phong {
    // TODO:  Modify the shader below (right now it's just the same fragment shader as Textured_Phong) for requirement #6.
    fragment_glsl_code() {
        return this.shared_glsl_code() + `
            varying vec2 f_tex_coord;
            uniform sampler2D texture;
            uniform float animation_time;
            
            void main(){
                // Sample the texture image in the correct place:
                
                // moving 2 texture unit per second
                // mod animation_time will prevent speed from increasing forever
                // mod >= .5 is ok since speed is 2
                float speed = mod(animation_time, 1.) * 2.;
                mat4 trans_mat = mat4(
                    vec4(-1., 0., 0., 0.),
                    vec4(0., 1., 0., 0.),
                    vec4(0., 0., 1., 0.),
                    vec4(mod(animation_time, 1.) * 2., 0., 0., 1.)
                );
                vec4 f_tex_vec4 = vec4(f_tex_coord, 0., 1.);
                f_tex_vec4 = trans_mat * f_tex_vec4;
                vec2 f_tex_coord = vec2(f_tex_vec4.x, f_tex_vec4.y);
                
                vec4 tex_color = texture2D( texture, f_tex_coord );
                
                
                
                // mod to make sure every square has correct black stripe
                // since texture coordinate is multiplied by 2 to have 4
                // squares on each surface
                
                float bx = mod(f_tex_coord.x, 1.);
                float by = mod(f_tex_coord.y, 1.);
                
                // 0.85-0.15 = 0.7
                // 0.75-0.25 = 0.5
                // bottom:  x(0.15, 0.85) y(0.15, 0.25) 
                // top:     x(0.15, 0.85) y(0.75, 0.85) 
                // left:    x(0.15, 0.25) y(0.15, 0.85)
                // right:   x(0.75, 0.85) y(0.15, 0.85) 
                if ((bx >= 0.15 && bx <= 0.85 && by >= 0.15 && by <= 0.25)
                    || (bx >= 0.15 && bx <= 0.85 && by >= 0.75 && by <= 0.85)
                    || (bx >= 0.15 && bx <= 0.25 && by >= 0.15 && by <= 0.85)
                    || (bx >= 0.75 && bx <= 0.85 && by >= 0.15 && by <= 0.85)
                ) tex_color = vec4(0., 0., 0., 1.);
                
                if( tex_color.w < .01 ) discard;
                                                                         // Compute an initial (ambient) color:
                gl_FragColor = vec4( ( tex_color.xyz + shape_color.xyz ) * ambient, shape_color.w * tex_color.w ); 
                                                                         // Compute the final color with contributions from lights:
                gl_FragColor.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
        } `;
    }
}


class Texture_Rotate extends Textured_Phong {
    // TODO:  Modify the shader below (right now it's just the same fragment shader as Textured_Phong) for requirement #7.
    fragment_glsl_code() {
        return this.shared_glsl_code() + `
            varying vec2 f_tex_coord;
            uniform sampler2D texture;
            uniform float animation_time;
            void main(){
                // Sample the texture image in the correct place:
                
                // cube 1: 15rpm
                // 15 * 2pi / 60 = 1/2 * pi rad/s = 1/2 * 3.1415926
                
                // rotation speed is .5
                // mod 4. to complete one cycle
                float angle = .5 * 3.1415926 * mod(animation_time, 4.);
                mat4 rot_mat = mat4(
                    vec4(cos(angle), -sin(angle), 0., 0.),
                    vec4(sin(angle), cos(angle), 0., 0.),
                    vec4(0., 0., 1., 0.),
                    vec4(0., 0., 0., 1.)
                );
                
                // rotate
                // pad zero
                vec4 f_tex_vec4 = vec4(f_tex_coord, 0., 0.);
                f_tex_vec4 += vec4(-.5, -.5, 0., 0.);
                f_tex_vec4 = rot_mat * f_tex_vec4;
                f_tex_vec4 += vec4(.5, .5, 0., 0.);
                
                vec2 f_tex_coord = vec2(f_tex_vec4.x, f_tex_vec4.y);
                vec4 tex_color = texture2D( texture, f_tex_coord );
                
                
                float bx = mod(f_tex_coord.x, 1.);
                float by = mod(f_tex_coord.y, 1.);
                if ((bx >= 0.15 && bx <= 0.85 && by >= 0.15 && by <= 0.25)
                    || (bx >= 0.15 && bx <= 0.85 && by >= 0.75 && by <= 0.85)
                    || (bx >= 0.15 && bx <= 0.25 && by >= 0.15 && by <= 0.85)
                    || (bx >= 0.75 && bx <= 0.85 && by >= 0.15 && by <= 0.85)
                ) tex_color = vec4(0., 0., 0., 1.);
                 
                if ( tex_color.w < .01 ) discard;
                                                                         // Compute an initial (ambient) color:
                gl_FragColor = vec4( ( tex_color.xyz + shape_color.xyz ) * ambient, shape_color.w * tex_color.w ); 
                                                                         // Compute the final color with contributions from lights:
                gl_FragColor.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
        } `;
    }
}

