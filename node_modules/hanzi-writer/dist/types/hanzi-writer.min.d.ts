type BoundEvent = {
    getPoint(): Point;
    preventDefault(): void;
};
/** Generic render target */
declare class RenderTargetBase<TElement extends HTMLElement | SVGElement | SVGSVGElement | HTMLCanvasElement = HTMLElement> {
    node: TElement;
    constructor(node: TElement);
    addPointerStartListener(callback: (arg: BoundEvent) => void): void;
    addPointerMoveListener(callback: (arg: BoundEvent) => void): void;
    addPointerEndListener(callback: () => void): void;
    getBoundingClientRect(): DOMRect;
    updateDimensions(width: string | number, height: string | number): void;
    _eventify<TEvent extends Event>(evt: TEvent, pointFunc: (event: TEvent) => Point): {
        getPoint: () => Point;
        preventDefault: () => void;
    };
    _getMousePoint(evt: MouseEvent): Point;
    _getTouchPoint(evt: TouchEvent): Point;
}
type PositionerOptions = {
    /** Default: 0 */
    width: number;
    /** Default: 0 */
    height: number;
    /** Default: 20 */
    padding: number;
};
declare class Positioner {
    padding: number;
    width: number;
    height: number;
    xOffset: number;
    yOffset: number;
    scale: number;
    constructor(options: PositionerOptions);
    convertExternalPoint(point: Point): {
        x: number;
        y: number;
    };
}
interface HanziWriterRendererBase<TElementType extends HTMLElement | HTMLCanvasElement | SVGElement | SVGSVGElement, TRenderTarget extends RenderTargetBase<TElementType>> {
    _character: Character;
    _positioner: Positioner;
    mount(target: TRenderTarget): void;
    render(props: RenderStateObject): void;
    destroy(): void;
}
interface HanziWriterRendererConstructor {
    new (character: Character, positioner: Positioner): HanziWriterRendererBase<any, any>;
}
type CharacterJson = {
    strokes: string[];
    medians: number[][][];
    radStrokes?: number[];
};
type CharDataLoaderFn = (char: string, onLoad: (data: CharacterJson) => void, onError: (err?: any) => void) => Promise<CharacterJson> | CharacterJson | void;
type Point = {
    x: number;
    y: number;
};
type ColorObject = {
    r: number;
    g: number;
    b: number;
    a: number;
};
type ColorOptions = {
    /** (Hex string, Default: "#555"). The color to draw each stroke. */
    strokeColor: string;
    /** (Hex string, Default: null). The color to draw the radical in the stroke, if radical data is present. Radicals will be drawn the same color as other strokes if this is not set. */
    radicalColor: string | null;
    /** (Hex string, Default: "#AAF"). The color to use for highlighting in quizzes. */
    highlightColor: string;
    /** (Hex string, Default: "#DDD"). The color of the character outline.  */
    outlineColor: string;
    /** (Hex string, Default: "#333"). The color of the lines drawn by users during quizzing. */
    drawingColor: string;
    /** (Hex string, Default: null). The color to use when highlighting the character on complete in quizzes. If not set, `highlightColor` will be used instead. Only relevant if `highlightOnComplete` is `true`. */
    highlightCompleteColor: string | null;
};
type OnCompleteFunction = (res: {
    canceled: boolean;
}) => void;
/** Creates a render target (e.g. svg, canvas) */
type RenderTargetInitFunction<TElement extends HTMLElement | SVGElement | SVGSVGElement | HTMLCanvasElement> = (elmOrId: string | TElement, width?: string | number | null, height?: string | number | null) => RenderTargetBase<TElement>;
type StrokeData = {
    character: string;
    drawnPath: {
        pathString: string;
        points: Point[];
    };
    isBackwards: boolean;
    strokeNum: number;
    mistakesOnStroke: number;
    totalMistakes: number;
    strokesRemaining: number;
};
type QuizOptions = {
    /** Default: 1. This can be set to make stroke grading more or less lenient. The closer this is to 0 the more strictly the quiz is graded. */
    leniency: number;
    /** Highlights the correct stroke after a set number of incorrect attempts. Setting `false` disables entirely. Default: 3 */
    showHintAfterMisses: number | false;
    /** After a quiz is completed successfully, the character will flash briefly. Default: true */
    highlightOnComplete: boolean;
    /** Whether to treat strokes which are correct besides their direction as correct. */
    acceptBackwardsStrokes: boolean;
    /** Begin quiz on this stroke number rather than stroke 0 */
    quizStartStrokeNum: number;
    /** After a user makes this many mistakes, just mark the stroke correct and move on. Default: false */
    markStrokeCorrectAfterMisses: number | false;
    /** bigger = more lenient */
    averageDistanceThreshold: number;
    onMistake?: (strokeData: StrokeData) => void;
    onCorrectStroke?: (strokeData: StrokeData) => void;
    /** Callback when the quiz completes */
    onComplete?: (summary: {
        character: string;
        totalMistakes: number;
    }) => void;
};
type LoadingManagerOptions = {
    charDataLoader: CharDataLoaderFn;
    onLoadCharDataSuccess?: null | ((data: CharacterJson) => void);
    onLoadCharDataError?: null | ((error?: Error | string) => void);
};
type BaseHanziWriterOptions = {
    showOutline: boolean;
    showCharacter: boolean;
    /** Default: svg */
    renderer: "svg" | "canvas";
    // Animation options
    /** Default: 1 */
    strokeAnimationSpeed: number;
    /** Default: 400 */
    strokeFadeDuration: number;
    /** Default: 2 */
    strokeHighlightSpeed: number;
    /** Default: 1000 */
    delayBetweenStrokes: number;
    /** Default: 2000 */
    delayBetweenLoops: number;
    /** Default: 300 */
    drawingFadeDuration: number;
    /** Default: 4 */
    drawingWidth: number;
    /** Default: 2 */
    strokeWidth: number;
    /** Default: 2 */
    outlineWidth: number;
    rendererOverride: {
        HanziWriterRenderer?: HanziWriterRendererConstructor;
        createRenderTarget?: RenderTargetInitFunction<any>;
    };
    /** @deprecated Use `strokeAnimationSpeed` */
    strokeAnimationDuration?: number;
    /** @deprecated Use `strokeHighlightSpeed` */
    strokeHighlightDuration: number;
};
type HanziWriterOptions = Partial<PositionerOptions> & QuizOptions & ColorOptions & LoadingManagerOptions & BaseHanziWriterOptions;
type DimensionOptions = {
    width: number;
    height: number;
    padding: number;
};
type ParsedHanziWriterOptions = QuizOptions & LoadingManagerOptions & BaseHanziWriterOptions & ColorOptions & DimensionOptions;
type RecursivePartial<T> = {
    [P in keyof T]?: RecursivePartial<T[P]>;
};
declare class Stroke {
    path: string;
    points: Point[];
    strokeNum: number;
    isInRadical: boolean;
    constructor(path: string, points: Point[], strokeNum: number, isInRadical?: boolean);
    getStartingPoint(): Point;
    getEndingPoint(): Point;
    getLength(): number;
    getVectors(): {
        x: number;
        y: number;
    }[];
    getDistance(point: Point): number;
    getAverageDistance(points: Point[]): number;
}
declare class Character {
    symbol: string;
    strokes: Stroke[];
    constructor(symbol: string, strokes: Stroke[]);
}
/** Used by `Mutation` & `Delay` */
interface GenericMutation<TRenderStateClass extends GenericRenderStateClass = RenderState> {
    /** Allows mutations starting with the provided string to be cancelled */
    scope: string;
    /** Can be useful for checking whether the mutation is running */
    _runningPromise: Promise<void> | undefined;
    run(renderState: TRenderStateClass): Promise<void>;
    pause(): void;
    resume(): void;
    cancel(renderState: TRenderStateClass): void;
}
type GenericRenderStateClass<T = any> = {
    state: T;
    updateState(changes: RecursivePartial<T>): void;
};
type StrokeRenderState = {
    opacity: number;
    displayPortion: number;
};
type CharacterRenderState = {
    opacity: number;
    strokes: Record<number | string, StrokeRenderState>;
};
type RenderStateObject = {
    options: {
        drawingFadeDuration: number;
        drawingWidth: number;
        drawingColor: ColorObject;
        strokeColor: ColorObject;
        outlineColor: ColorObject;
        radicalColor: ColorObject;
        highlightColor: ColorObject;
    };
    character: {
        main: CharacterRenderState;
        outline: CharacterRenderState;
        highlight: CharacterRenderState;
    };
    userStrokes: Record<string, {
        points: Point[];
        opacity: number;
    } | undefined> | null;
};
type OnStateChangeCallback = (nextState: RenderStateObject, currentState: RenderStateObject) => void;
type MutationChain = {
    _isActive: boolean;
    _index: number;
    _resolve: OnCompleteFunction;
    _mutations: GenericMutation[];
    _loop: boolean | undefined;
    _scopes: string[];
};
type RenderStateOptions = {
    strokeColor: string;
    radicalColor: string | null;
    highlightColor: string;
    outlineColor: string;
    drawingColor: string;
    drawingFadeDuration: number;
    drawingWidth: number;
    outlineWidth: number;
    showCharacter: boolean;
    showOutline: boolean;
};
declare class RenderState {
    _mutationChains: MutationChain[];
    _onStateChange: OnStateChangeCallback;
    state: RenderStateObject;
    constructor(character: Character, options: RenderStateOptions, onStateChange?: OnStateChangeCallback);
    overwriteOnStateChange(onStateChange: OnStateChangeCallback): void;
    updateState(stateChanges: RecursivePartial<RenderStateObject>): void;
    run(mutations: GenericMutation[], options?: {
        loop?: boolean;
    }): Promise<{
        canceled: boolean;
    }>;
    _run(mutationChain: MutationChain): void;
    _getActiveMutations(): GenericMutation<RenderState>[];
    pauseAll(): void;
    resumeAll(): void;
    cancelMutations(scopesToCancel: string[]): void;
    cancelAll(): void;
    _cancelMutationChain(mutationChain: MutationChain): void;
}
declare class UserStroke {
    id: number;
    points: Point[];
    externalPoints: Point[];
    constructor(id: number, startingPoint: Point, startingExternalPoint: Point);
    appendPoint(point: Point, externalPoint: Point): void;
}
// smaller = more lenient
interface StrokeMatchResultMeta {
    isStrokeBackwards: boolean;
}
declare class Quiz {
    _character: Character;
    _renderState: RenderState;
    _isActive: boolean;
    _positioner: Positioner;
    /** Set on startQuiz */
    _options: ParsedHanziWriterOptions | undefined;
    _currentStrokeIndex: number;
    _mistakesOnStroke: number;
    _totalMistakes: number;
    _userStroke: UserStroke | undefined;
    _userStrokesIds: Array<number> | undefined;
    constructor(character: Character, renderState: RenderState, positioner: Positioner);
    startQuiz(options: ParsedHanziWriterOptions): Promise<{
        canceled: boolean;
    }>;
    startUserStroke(externalPoint: Point): void | Promise<{
        canceled: boolean;
    }> | null;
    continueUserStroke(externalPoint: Point): Promise<void> | Promise<{
        canceled: boolean;
    }>;
    setPositioner(positioner: Positioner): void;
    endUserStroke(): void;
    cancel(): void;
    _getStrokeData({ isCorrect, meta }: {
        isCorrect: boolean;
        meta: StrokeMatchResultMeta;
    }): StrokeData;
    nextStroke(): void;
    _handleSuccess(meta: StrokeMatchResultMeta): void;
    _handleFailure(meta: StrokeMatchResultMeta): void;
    _getCurrentStroke(): default;
}
type CustomError = Error & {
    reason: string;
};
declare class LoadingManager {
    _loadCounter: number;
    _isLoading: boolean;
    _resolve: ((data: CharacterJson) => void) | undefined;
    _reject: ((error?: Error | CustomError | string) => void) | undefined;
    _options: LoadingManagerOptions;
    /** Set when calling LoadingManager.loadCharData  */
    _loadingChar: string | undefined;
    /** use this to attribute to determine if there was a problem with loading */
    loadingFailed: boolean;
    constructor(options: LoadingManagerOptions);
    _debouncedLoad(char: string, count: number): void;
    _setupLoadingPromise(): Promise<void | CharacterJson>;
    loadCharData(char: string): Promise<void | CharacterJson>;
}
declare class HanziWriter {
    _options: ParsedHanziWriterOptions;
    _loadingManager: LoadingManager;
    /** Only set when calling .setCharacter() */
    _char: string | undefined;
    /** Only set when calling .setCharacter() */
    _renderState: RenderState | undefined;
    /** Only set when calling .setCharacter() */
    _character: Character | undefined;
    /** Only set when calling .setCharacter() */
    _positioner: Positioner | undefined;
    /** Only set when calling .setCharacter() */
    _hanziWriterRenderer: HanziWriterRendererBase<HTMLElement, any> | null | undefined;
    /** Only set when calling .setCharacter() */
    _withDataPromise: Promise<void> | undefined;
    _quiz: Quiz | undefined;
    _renderer: {
        HanziWriterRenderer: HanziWriterRendererConstructor;
        createRenderTarget: RenderTargetInitFunction<any>;
    };
    target: RenderTargetBase;
    /** Main entry point */
    /** Main entry point */
    static create(element: string | HTMLElement, character: string, options?: Partial<HanziWriterOptions>): HanziWriter;
    /** Singleton instance of LoadingManager. Only set in `loadCharacterData` */
    static _loadingManager: LoadingManager | null;
    /** Singleton loading options. Only set in `loadCharacterData` */
    static _loadingOptions: Partial<HanziWriterOptions> | null;
    static loadCharacterData(character: string, options?: Partial<LoadingManagerOptions>): Promise<void | CharacterJson>;
    static getScalingTransform(width: number, height: number, padding?: number): {
        x: number;
        y: number;
        scale: number;
        transform: string;
    };
    constructor(element: string | HTMLElement, options?: Partial<HanziWriterOptions>);
    showCharacter(options?: {
        onComplete?: OnCompleteFunction;
        duration?: number;
    }): Promise<Promise<{
        canceled: boolean;
    }> | undefined>;
    hideCharacter(options?: {
        onComplete?: OnCompleteFunction;
        duration?: number;
    }): Promise<Promise<{
        canceled: boolean;
    }> | undefined>;
    animateCharacter(options?: {
        onComplete?: OnCompleteFunction;
    }): Promise<Promise<{
        canceled: boolean;
    }> | undefined>;
    animateStroke(strokeNum: number, options?: {
        onComplete?: OnCompleteFunction;
    }): Promise<Promise<{
        canceled: boolean;
    }> | undefined>;
    highlightStroke(strokeNum: number, options?: {
        onComplete?: OnCompleteFunction;
    }): Promise<Promise<{
        canceled: boolean;
    }> | undefined>;
    loopCharacterAnimation(): Promise<{
        canceled: boolean;
    } | undefined>;
    pauseAnimation(): Promise<void | undefined>;
    resumeAnimation(): Promise<void | undefined>;
    showOutline(options?: {
        duration?: number;
        onComplete?: OnCompleteFunction;
    }): Promise<Promise<{
        canceled: boolean;
    }> | undefined>;
    hideOutline(options?: {
        duration?: number;
        onComplete?: OnCompleteFunction;
    }): Promise<Promise<{
        canceled: boolean;
    }> | undefined>;
    /** Updates the size of the writer instance without resetting render state */
    /** Updates the size of the writer instance without resetting render state */
    updateDimensions({ width, height, padding }: Partial<DimensionOptions>): void;
    updateColor(colorName: keyof ColorOptions, colorVal: string | null, options?: {
        duration?: number;
        onComplete?: OnCompleteFunction;
    }): Promise<Promise<{
        canceled: boolean;
    }> | undefined>;
    quiz(quizOptions?: Partial<QuizOptions>): Promise<Promise<void> | undefined>;
    skipQuizStroke(): void;
    cancelQuiz(): void;
    setCharacter(char: string): Promise<void>;
    _initAndMountHanziWriterRenderer(character: Character): HanziWriterRendererBase<any, any>;
    getCharacterData(): Promise<Character>;
    _assignOptions(options: Partial<HanziWriterOptions>): ParsedHanziWriterOptions;
    /** returns a new options object with width and height filled in if missing */
    /** returns a new options object with width and height filled in if missing */
    _fillWidthAndHeight(options: HanziWriterOptions): ParsedHanziWriterOptions;
    _withData<T>(func: () => T): Promise<T | undefined>;
    _setupListeners(): void;
}
export { PositionerOptions, CharacterJson, CharDataLoaderFn, Point, ColorObject, ColorOptions, OnCompleteFunction, RenderTargetInitFunction, StrokeData, QuizOptions, LoadingManagerOptions, HanziWriterOptions, DimensionOptions, ParsedHanziWriterOptions, RecursivePartial, HanziWriter as default };
