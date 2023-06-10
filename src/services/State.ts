import React from 'react'
import { copy, merge, type Noop, } from '@arcaelas/utils'

type NoopSync<A = any, B = any> = Noop<A, B> extends (...args: infer P) => infer R ? (...args: P) => Awaited<R> : never
export type IState<S> = S extends never | null | undefined ? null : (
	S extends object ? Partial<S> & Record<string | number, any> : S
)
export type DispatchParam<S> = IState<S> | NoopSync<[current: IState<S>], IState<S>>
export type DispatchState<S> = (state: DispatchParam<S>) => void


export default interface State<S = any> {
	/**
	 * @description Use this function to create a data store that can be called from any component,
	 * this store can be updated even from outside a React component.
	 * @example
	 * const useStore = new State({
	 * 	name:'anonymous',
	 * 	followers: 100
	 * })
	 * 
	 * function ProfileComponent(){
	 * 	const [ state, setState ] = useStore()
	 * 	return <div>
	 * 		Hi {state.name},
	 * 		<span children='click' onClick={()=> setState({ folowers: state.folowers + 1 })} /> here for increment your followers!
	 * 	</div>
	 * }
	 * @description
	 * If the initial value of a store is an array,
	 * it will always be treated as an array,
	 * it is important to know that arrays are mutable and trigger an event when modified.
	 * @example
	 * const useStore = new State([])
	 * function MyShops(){
	 * 	const [ shops, setShops ] = useStore()
	 * 	return <>
	 * 		<button onClick={()=> setShops(shops.slice(1))}> Remove first shop </button>
	 * 		<ul>
	 * 			{shops.map(shop=> <li> { shop.name } </li>)}
	 * 		</ul>
	 * 		<button onClick={()=> shops.pop()}> Remove last shop </button>
	 * 	</>
	 * }
	 * 
	*/
	new(state: IState<S>): void
	(): [IState<S>, DispatchState<S>]
}
export default class State<S = any> extends Function {

	private state
	constructor(state) {
		super('...args', 'return this.__call(...args)')
		this.state = state ?? null
		return this.bind(this)
	}

	private readonly events = new EventTarget()
	private listen(evt: string, handler: Noop) {
		const bind = ({ detail }: CustomEvent) => handler(...detail)
		this.events.addEventListener(evt, bind)
		return () => this.events.removeEventListener(evt, bind)
	}
	private emit(evt: string, ...args: any[]) {
		this.events.dispatchEvent(new CustomEvent(evt, {
			detail: args
		}))
	}

	/**
	 * @description
	 * Get a copy of current state, without relationship.
	 */
	get value(): S {
		return copy(this.state)
	}
	set value(value: S) {
		this.set(value as any)
	}

	queue = []
	/**
	 * @description
	 * Fire trigger when state is changed but before change components
	 */
	onChange(handler: NoopSync<[next: S, prev: S], S>): NoopSync
	/**
	 * @description
	 * Fire only if some those keys was changed
	 */
	onChange(handler: NoopSync<[next: S, prev: S], S>, shouldHandler: string[]): NoopSync
	/**
	 * @description
	 * Fire only if validator function be true.
	 */
	onChange(handler: NoopSync<[next: S, prev: S], S>, shouldHandler: NoopSync<[next: S, prev: S], boolean>): NoopSync
	onChange(handler: any, validator?: any): any {
		validator = validator ? (
			Array.isArray(validator) ? (next: S, prev: S) => (validator as any).some((k: string) => next?.[k] !== prev?.[k]) : validator
		) : Boolean.bind(null, 1)
		const subscriptor = (next: S, prev: S) => (validator as any)(next, prev) && handler(next, prev)
		this.queue.push(subscriptor)
		return () => Boolean(this.queue.splice(
			this.queue.indexOf(subscriptor), 1
		))
	}

	/**
	 * @description
	 * You can also update the state of the store while outside of a component.
	 * @example
	 * window.onload = ()=>{
	 * 	useStore.set({ ready: true })
	 * }
	 */
	set(state: DispatchParam<S>): void
	set(state: any) {
		const original = copy(this.state)
		state = typeof state === 'function' ? state(copy(original)) : state
		state = Array.isArray(state) ? state : (
			(typeof (state ?? 0) === 'object' && typeof (original ?? 0) === 'object')
				? merge({}, original, state) : state
		)
		console.log('This:', this)
		if (this.state !== state) {
			for (const cb of this.queue)
				state = cb(state, copy(original))
			this.emit('onchange', this.state = state)
		}
	}

	private __call() {
		const [state, setState] = React.useState(this.state)
		this.emit('onmount', state)
		React.useEffect(() => this.listen('onchange', value => setState(value)), [setState])
		return [state, this.set.bind(this)]
	}
}