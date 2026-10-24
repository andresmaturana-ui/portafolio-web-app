// Transición líquida de ART?ST adaptada a la portada: la escena de un proyecto (sus celulares, tablet o
// escritorio, dibujados antes en un lienzo) se «derrite» en la del siguiente (ruido + separación RGB +
// colores girando). Al pasar el dedo o el mouse, la escena se distorsiona alrededor del puntero.
const VS = "attribute vec2 p;varying vec2 uv;void main(){uv=p*.5+.5;uv.y=1.-uv.y;gl_Position=vec4(p,0,1);}";
const FS = `precision highp float;varying vec2 uv;
uniform sampler2D t0,t1;uniform float prog,time,strength,hover;uniform vec2 res,mouse;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p*=2.;a*=.5;}return v;}
vec3 hue(vec3 c,float a){const vec3 k=vec3(.57735);float ca=cos(a);return c*ca+cross(k,c)*sin(a)+k*dot(k,c)*(1.-ca);}
vec4 samp(sampler2D t,vec2 c,float ab){vec4 o=texture2D(t,c);return vec4(texture2D(t,c+vec2(ab,0)).r,o.g,texture2D(t,c-vec2(ab,0)).b,o.a);}
void main(){
 float w=sin(prog*3.14159);
 vec2 q=uv*3.;float f=fbm(q+vec2(time*.25,-time*.2)+fbm(q*1.7-time*.15));
 vec2 d=vec2(cos(f*6.2831),sin(f*6.2831))*(f-.3)*strength*w;
 float edge=smoothstep(prog-.18,prog+.18,f*.9+uv.y*.1+.05);
 vec2 pm=(uv-mouse)*vec2(res.x/res.y,1.);
 float m=hover*exp(-dot(pm,pm)/.012);
 vec2 dm=vec2(cos(f*6.2831),sin(f*6.2831))*.05*m-pm*.35*m;
 float ab=.025*w*strength/.35+.012*m;
 vec4 c0=samp(t0,uv+d*prog+dm,ab);
 vec4 c1=samp(t1,uv-d*(1.-prog)+dm,ab);
 vec4 c=mix(c1,c0,edge);
 float s=min(1.,strength/.35);
 c.rgb=hue(c.rgb,w*f*5.*s+m*f*2.);
 c.rgb=mix(c.rgb,c.rgb*1.2+vec3(.06,0,.1)*w,w*s);
 gl_FragColor=c;}`;

export function liquidSupported() {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return false;
  try {
    return !!document.createElement("canvas").getContext("webgl");
  } catch {
    return false;
  }
}

export function createLiquid(canvas: HTMLCanvasElement, strength: number) {
  const gl = canvas.getContext("webgl", { premultipliedAlpha: false, alpha: true });
  if (!gl) return null;
  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog);
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U: Record<string, WebGLUniformLocation | null> = {};
  ["t0", "t1", "prog", "time", "strength", "hover", "res", "mouse"].forEach((k) => {
    U[k] = gl.getUniformLocation(prog, k);
  });
  [0, 1].forEach((unit) => {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  });
  gl.uniform1i(U.t0, 0);
  gl.uniform1i(U.t1, 1);
  gl.uniform1f(U.strength, strength);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  let dpr = 1;

  const resize = () => {
    dpr = Math.min(1.5, window.devicePixelRatio || 1);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(U.res, canvas.clientWidth, canvas.clientHeight);
  };

  // Si una imagen no permite CORS, texImage2D lanza un error y la portada usa el carrusel.
  const upload = (unit: 0 | 1, src: TexImageSource | null) => {
    if (!src) return;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
  };

  // a y b: lienzos con la escena de cada proyecto, del mismo tamaño que este (null = no cambió, no se vuelve a subir).
  // mouse: posición del puntero en px dentro del lienzo; hover: 0 (quieto) → 1 (moviéndose).
  const draw = (a: TexImageSource | null, b: TexImageSource | null, p: number, time: number, mouse: [number, number], hover: number) => {
    upload(0, a);
    upload(1, b);
    gl.uniform2f(U.mouse, mouse[0] / (canvas.clientWidth || 1), mouse[1] / (canvas.clientHeight || 1));
    gl.uniform1f(U.hover, hover);
    gl.uniform1f(U.prog, p);
    gl.uniform1f(U.time, time);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  const size = () => ({ width: canvas.width, height: canvas.height, dpr });
  resize();
  return { draw, resize, size };
}
