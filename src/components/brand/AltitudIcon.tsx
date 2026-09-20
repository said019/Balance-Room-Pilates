import { createElement, useId, type SVGProps } from 'react';

const icons = {
  "fuerza": [
    {
      "tag": "rect",
      "attrs": {
        "x": 4,
        "y": 6,
        "width": 3,
        "height": 12,
        "rx": 1
      }
    },
    {
      "tag": "rect",
      "attrs": {
        "x": 17,
        "y": 6,
        "width": 3,
        "height": 12,
        "rx": 1
      }
    },
    {
      "tag": "path",
      "attrs": {
        "d": "M7 12h10M2 9v6M22 9v6"
      }
    }
  ],
  "hibrido": [
    {
      "tag": "path",
      "attrs": {
        "d": "M4 8a8 8 0 0 1 14-2l2 2M20 3v5h-5M20 16a8 8 0 0 1-14 2l-2-2M4 21v-5h5M13 8l-3 4h4l-3 4"
      }
    }
  ],
  "running": [
    {
      "tag": "circle",
      "attrs": {
        "cx": 15,
        "cy": 4,
        "r": 1.7
      }
    },
    {
      "tag": "path",
      "attrs": {
        "d": "m4 10 4-2 4 2 3 4 5 1M12 10l2-3 3 3h3M11 13l-2 4-5 3M11 13l4 5-1 4"
      }
    }
  ],
  "kettlebell": [
    {
      "tag": "path",
      "attrs": {
        "d": "M9 8V6a3 3 0 0 1 6 0v2M8 8h8l3 9a3 3 0 0 1-3 4H8a3 3 0 0 1-3-4Z"
      }
    }
  ],
  "intervalos": [
    {
      "tag": "circle",
      "attrs": {
        "cx": 12,
        "cy": 14,
        "r": 7.5
      }
    },
    {
      "tag": "path",
      "attrs": {
        "d": "M10 2h4M12 2v4M18 7l2-2M12 10v4l3 2"
      }
    }
  ],
  "movilidad": [
    {
      "tag": "circle",
      "attrs": {
        "cx": 12,
        "cy": 4,
        "r": 1.7
      }
    },
    {
      "tag": "path",
      "attrs": {
        "d": "M12 8v6M5 8l7 2 7-2M12 14l-4 7M12 14l4 7M3 11l-1 4 4-1M21 11l1 4-4-1"
      }
    }
  ],
  "rendimiento": [
    {
      "tag": "path",
      "attrs": {
        "d": "M4 20V5M4 20h16M8 16l4-5 3 2 5-8M16 5h4v4"
      }
    }
  ],
  "ruta": [
    {
      "tag": "circle",
      "attrs": {
        "cx": 5,
        "cy": 19,
        "r": 2
      }
    },
    {
      "tag": "circle",
      "attrs": {
        "cx": 19,
        "cy": 5,
        "r": 2
      }
    },
    {
      "tag": "path",
      "attrs": {
        "d": "M7 19h8a4 4 0 0 0 0-8H9a4 4 0 0 1 0-8h5M16 3l-2 2"
      }
    }
  ],
  "perfil": [
    {
      "tag": "circle",
      "attrs": {
        "cx": 12,
        "cy": 7,
        "r": 3.5
      }
    },
    {
      "tag": "path",
      "attrs": {
        "d": "M4 21v-2a8 8 0 0 1 16 0v2"
      }
    }
  ],
  "comunidad": [
    {
      "tag": "circle",
      "attrs": {
        "cx": 12,
        "cy": 7,
        "r": 3
      }
    },
    {
      "tag": "path",
      "attrs": {
        "d": "M6 21v-2a6 6 0 0 1 12 0v2M4 5a3 3 0 0 0 0 6M20 5a3 3 0 0 1 0 6M2 19v-2a5 5 0 0 1 3-4M22 19v-2a5 5 0 0 0-3-4"
      }
    }
  ],
  "coach": [
    {
      "tag": "circle",
      "attrs": {
        "cx": 8,
        "cy": 6,
        "r": 3
      }
    },
    {
      "tag": "path",
      "attrs": {
        "d": "M2 21v-3a6 6 0 0 1 12 0v3M16 3h6v11h-5M16 7h3M17 18l2 2 3-4"
      }
    }
  ],
  "logro": [
    {
      "tag": "circle",
      "attrs": {
        "cx": 12,
        "cy": 9,
        "r": 6
      }
    },
    {
      "tag": "path",
      "attrs": {
        "d": "m8 14-2 8 6-3 6 3-2-8M9 9l2 2 4-4"
      }
    }
  ],
  "objetivo": [
    {
      "tag": "circle",
      "attrs": {
        "cx": 12,
        "cy": 12,
        "r": 9
      }
    },
    {
      "tag": "circle",
      "attrs": {
        "cx": 12,
        "cy": 12,
        "r": 5
      }
    },
    {
      "tag": "circle",
      "attrs": {
        "cx": 12,
        "cy": 12,
        "r": 1
      }
    }
  ],
  "racha": [
    {
      "tag": "path",
      "attrs": {
        "d": "M13 2c1 5-3 6-1 9 2-1 3-3 3-5 4 4 6 7 5 11a8 8 0 0 1-15 0c-1-4 2-7 5-10-1 3-1 4 0 5 2-3 0-5 3-10Z"
      }
    }
  ],
  "bienestar": [
    {
      "tag": "path",
      "attrs": {
        "d": "M12 21S3 16 3 9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 7-9 12-9 12Z"
      }
    },
    {
      "tag": "path",
      "attrs": {
        "d": "M5 12h4l2-4 3 8 2-4h3"
      }
    }
  ],
  "ubicacion": [
    {
      "tag": "path",
      "attrs": {
        "d": "M19 9c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 14 0Z"
      }
    },
    {
      "tag": "circle",
      "attrs": {
        "cx": 12,
        "cy": 9,
        "r": 2.5
      }
    }
  ],
  "calendario": [
    {
      "tag": "rect",
      "attrs": {
        "x": 3,
        "y": 5,
        "width": 18,
        "height": 16,
        "rx": 2
      }
    },
    {
      "tag": "path",
      "attrs": {
        "d": "M7 2v6M17 2v6M3 10h18M7 14h2M15 14h2M7 18h2"
      }
    }
  ],
  "horario": [
    {
      "tag": "circle",
      "attrs": {
        "cx": 12,
        "cy": 12,
        "r": 9
      }
    },
    {
      "tag": "path",
      "attrs": {
        "d": "M12 6v6l4 2"
      }
    }
  ],
  "reservar": [
    {
      "tag": "rect",
      "attrs": {
        "x": 3,
        "y": 5,
        "width": 18,
        "height": 16,
        "rx": 2
      }
    },
    {
      "tag": "path",
      "attrs": {
        "d": "M7 2v6M17 2v6M3 10h18M12 13v5M9.5 15.5h5"
      }
    }
  ],
  "confirmado": [
    {
      "tag": "circle",
      "attrs": {
        "cx": 12,
        "cy": 12,
        "r": 9
      }
    },
    {
      "tag": "path",
      "attrs": {
        "d": "m7.5 12 3 3 6-6"
      }
    }
  ],
  "cancelar": [
    {
      "tag": "circle",
      "attrs": {
        "cx": 12,
        "cy": 12,
        "r": 9
      }
    },
    {
      "tag": "path",
      "attrs": {
        "d": "m8.5 8.5 7 7M15.5 8.5l-7 7"
      }
    }
  ],
  "espera": [
    {
      "tag": "path",
      "attrs": {
        "d": "M4 4h16M4 20h16M6 4c0 4 1 6 6 8-5 2-6 4-6 8M18 4c0 4-1 6-6 8 5 2 6 4 6 8M9 7h6M9 18h6"
      }
    }
  ],
  "checkin": [
    {
      "tag": "path",
      "attrs": {
        "d": "M9 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H9M2 12h12M10 8l4 4-4 4"
      }
    }
  ],
  "qr": [
    {
      "tag": "rect",
      "attrs": {
        "x": 3,
        "y": 3,
        "width": 6,
        "height": 6,
        "rx": 0.7
      }
    },
    {
      "tag": "rect",
      "attrs": {
        "x": 15,
        "y": 3,
        "width": 6,
        "height": 6,
        "rx": 0.7
      }
    },
    {
      "tag": "rect",
      "attrs": {
        "x": 3,
        "y": 15,
        "width": 6,
        "height": 6,
        "rx": 0.7
      }
    },
    {
      "tag": "path",
      "attrs": {
        "d": "M15 15h3v3h3v3h-6v-3M21 14v1"
      }
    }
  ],
  "membresia": [
    {
      "tag": "rect",
      "attrs": {
        "x": 2,
        "y": 5,
        "width": 20,
        "height": 14,
        "rx": 2
      }
    },
    {
      "tag": "circle",
      "attrs": {
        "cx": 7,
        "cy": 11,
        "r": 2
      }
    },
    {
      "tag": "path",
      "attrs": {
        "d": "M4 16a3 3 0 0 1 6 0M14 10h5M14 14h3"
      }
    }
  ],
  "ilimitado": [
    {
      "tag": "path",
      "attrs": {
        "d": "M12 12c-2.5-3.5-3.5-4.5-5.5-4.5a4.5 4.5 0 0 0 0 9c2 0 3-1 5.5-4.5Zm0 0c2.5-3.5 3.5-4.5 5.5-4.5a4.5 4.5 0 0 1 0 9c-2 0-3-1-5.5-4.5Z"
      }
    }
  ],
  "pago": [
    {
      "tag": "rect",
      "attrs": {
        "x": 2,
        "y": 5,
        "width": 20,
        "height": 14,
        "rx": 2
      }
    },
    {
      "tag": "path",
      "attrs": {
        "d": "M2 10h20M6 15h4"
      }
    }
  ],
  "transferencia": [
    {
      "tag": "path",
      "attrs": {
        "d": "M3 7h18M17 3l4 4-4 4M21 17H3M7 13l-4 4 4 4"
      }
    }
  ],
  "comprobante": [
    {
      "tag": "path",
      "attrs": {
        "d": "M5 2h10l4 4v16l-3-2-4 2-4-2-3 2ZM15 2v5h4M8 11h8M8 15h5"
      }
    }
  ],
  "notificacion": [
    {
      "tag": "path",
      "attrs": {
        "d": "M5 10a7 7 0 0 1 14 0v5l2 3H3l2-3ZM9 21h6M12 1v2"
      }
    }
  ],
  "ajustes": [
    {
      "tag": "path",
      "attrs": {
        "d": "M5 3v5M5 12v9M12 3v10M12 17v4M19 3v2M19 9v12"
      }
    },
    {
      "tag": "circle",
      "attrs": {
        "cx": 5,
        "cy": 10,
        "r": 2
      }
    },
    {
      "tag": "circle",
      "attrs": {
        "cx": 12,
        "cy": 15,
        "r": 2
      }
    },
    {
      "tag": "circle",
      "attrs": {
        "cx": 19,
        "cy": 7,
        "r": 2
      }
    }
  ],
  "ayuda": [
    {
      "tag": "circle",
      "attrs": {
        "cx": 12,
        "cy": 12,
        "r": 9
      }
    },
    {
      "tag": "path",
      "attrs": {
        "d": "M9 9a3 3 0 1 1 5 2c-1 1-2 1-2 3M12 17h.01"
      }
    }
  ]
} as const;
export type AltitudIconName = keyof typeof icons;
export type AltitudIconProps = Omit<SVGProps<SVGSVGElement>, 'children'> & { name: AltitudIconName; size?: number; title?: string };

/** Native 24px SVG. Inherits text color; decorative unless title is provided. */
export function AltitudIcon({name, size=24, title, ...props}: AltitudIconProps) {
 const id=useId();
 return <svg {...props} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.65} strokeLinecap="round" strokeLinejoin="round" role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} aria-labelledby={title ? id : undefined}>
  {title && <title id={id}>{title}</title>}
  {icons[name].map((node,index)=>createElement(node.tag,{...node.attrs,key:index}))}
 </svg>;
}
