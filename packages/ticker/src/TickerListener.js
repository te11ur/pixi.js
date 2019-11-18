/**
 * Internal class for handling the priority sorting of ticker handlers.
 *
 * @private
 * @class
 * @memberof PIXI
 */
export class TickerListener
{
    /**
     * The current priority.
     * @private
     * @member {number}
     */
    priority;
    /**
     * The next item in chain.
     * @private
     * @member {TickerListener}
     */
    next;
    /**
     * The previous item in chain.
     * @private
     * @member {TickerListener}
     */
    previous;

    /**
     * The handler function to execute.
     * @private
     * @member {Function}
     */
    fn;

    /**
     * The calling to execute.
     * @private
     * @member {*}
     */
    context;
    /**
     * If this should only execute once.
     * @private
     * @member {boolean}
     */
    once;

    /**
     * `true` if this listener has been destroyed already.
     * @member {boolean}
     * @private
     */
    _destroyed;

    /**
     * Constructor
     * @private
     * @param {Function} fn - The listener function to be added for one update
     * @param {*} [context=null] - The listener context
     * @param {number} [priority=0] - The priority for emitting
     * @param {boolean} [once=false] - If the handler should fire once
     */
    constructor(fn, context = null, priority = 0, once = false)
    {
        this.fn = fn;
        this.context = context;
        this.priority = priority;
        this.once = once;
        this.next = null;
        this.previous = null;
        this._destroyed = false;
    }

    /**
     * Simple compare function to figure out if a function and context match.
     * @private
     * @param {Function} fn - The listener function to be added for one update
     * @param {any} [context] - The listener context
     * @return {boolean} `true` if the listener match the arguments
     */
    match(fn, context = null)
    {
        return this.fn === fn && this.context === context;
    }

    /**
     * Emit by calling the current function.
     * @private
     * @param {number} deltaTime - time since the last emit.
     * @return {TickerListener} Next ticker
     */
    emit(deltaTime)
    {
        if (this.fn)
        {
            if (this.context)
            {
                this.fn.call(this.context, deltaTime);
            }
            else
            {
                this.fn(deltaTime);
            }
        }

        const redirect = this.next;

        if (this.once)
        {
            this.destroy(true);
        }

        // Soft-destroying should remove
        // the next reference
        if (this._destroyed)
        {
            this.next = null;
        }

        return redirect;
    }

    /**
     * Connect to the list.
     * @private
     * @param previous {TickerListener}  - Input node, previous listener
     */
    connect(previous)
    {
        this.previous = previous;
        if (previous.next)
        {
            previous.next.previous = this;
        }
        this.next = previous.next;
        previous.next = this;
    }

    /**
     * Destroy and don't use after this.
     * @private
     * @param {boolean} [hard = false] `true` to remove the `next` reference, this
     *        is considered a hard destroy. Soft destroy maintains the next reference.
     * @return {TickerListener} The listener to redirect while emitting or removing.
     */
    destroy(hard = false)
    {
        this._destroyed = true;
        this.fn = null;
        this.context = null;

        // Disconnect, hook up next and previous
        if (this.previous)
        {
            this.previous.next = this.next;
        }

        if (this.next)
        {
            this.next.previous = this.previous;
        }

        // Redirect to the next item
        const redirect = this.next;

        // Remove references
        this.next = hard ? null : redirect;
        this.previous = null;

        return redirect;
    }
}
