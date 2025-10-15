export var QueueStrategy;
(function (QueueStrategy) {
    /**
     * Use `Flush` to stop the current request when a new request is sent.
     */
    QueueStrategy[QueueStrategy["Flush"] = 0] = "Flush";
    /**
     * Use `Add` to buffer the speech request. The request will be executed when all previous requests have been completed.
     */
    QueueStrategy[QueueStrategy["Add"] = 1] = "Add";
})(QueueStrategy || (QueueStrategy = {}));
//# sourceMappingURL=definitions.js.map