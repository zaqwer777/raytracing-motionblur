declare module Whammy {
     class Video {
		constructor(speed?: number, quality?: number);
		
		// frame must be a a HTMLCanvasElement, a CanvasRenderingContext2D 
		// or a DataURI formatted string
		add(frame: HTMLCanvasElement, duration?: number): void;
		add(frame: CanvasRenderingContext2D, duration?: number): void;		
		add(frame: string, duration?: number): void;

		compile(outputAsArray: boolean): Uint8Array | Blob;		
	}

	function fromImageArray(images: Array<string>, fps?: number, outputAsArray?: boolean) : Uint8Array | Blob;
}

//declare var Whammy: whammy.Video;

declare module "whammy" {
	export = Whammy;
}
 