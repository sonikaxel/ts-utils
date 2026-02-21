/** Utility function for using
 * `createObjectURL` &  `revokeObjectURL`
 * static method of the URL interface
 * with extra features.
 */
export function objectURL() {
  /** Existing object URL array */
  let collector: string[] = [];

  function create(obj: Blob | MediaSource) {
    let url = URL.createObjectURL(obj);
    collector.push(url);
    return url;
  }

  function revoke(url: string) {
    URL.revokeObjectURL(url);
    collector = collector.filter((c) => c === url);
  }

  function clear() {
    for (const url of collector) {
      URL.revokeObjectURL(url);
    }
    collector = [];
  }

  return {
    /** Creates a string containing a URL representing the object */
    create,
    /** Releases an existing object URL */
    revoke,
    /** Releases all existing object URL created with `create` method */
    clear,
    /** Get all existing object URL */
    getValues: () => collector,
  };
}
