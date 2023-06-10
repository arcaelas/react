import React from 'react'
import { copy, merge, } from '@arcaelas/utils'

type Noop<A = any, R = any> = (...args: A extends any[] ? A : A[]) => R;
export type IState<S> = S extends never | null | undefined ? null : (
	S extends object ? Partial<S> & Record<string | number, any> : S
)
export type DispatchParam<S> = IState<S> | Noop<[current: IState<S>], IState<S>>
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
	new(state: S): void
	(): [IState<S>, DispatchState<S>]
}
export default class State<S = any> {

	constructor(private state: S) {
		return Object.setPrototypeOf(() => this.onCall(), this)
	}

	/**
	 * @description
	 * Get a copy of current state, without relationship.
	 */
	public get value(): S {
		return copy(this.state)
	}
	public set value(value: S) {
		this.set(value as any)
	}

	protected readonly events = new EventTarget()
	protected listen(evt: string, handler: Noop) {
		const bind = ({ detail }: CustomEvent) => handler(...[].concat(detail))
		this.events.addEventListener(evt, bind)
		return () => this.events.removeEventListener(evt, bind)
	}
	protected emit(evt: string, ...args: any[]) {
		return this.events.dispatchEvent(new CustomEvent(evt, {
			detail: args
		}))
	}

	protected readonly queue = []
	/**
	 * @description
	 * Fire trigger when state is changed but before change components
	 */
	public onChange(handler: Noop<[next: IState<S>, prev: IState<S>], IState<S>>): Noop
	/**
	 * @description
	 * Fire only if some those keys was changed
	 */
	public onChange(handler: Noop<[next: IState<S>, prev: IState<S>], IState<S>>, shouldHandler: string[]): Noop
	/**
	 * @description
	 * Fire only if validator function be true.
	 */
	public onChange(handler: Noop<[next: IState<S>, prev: IState<S>], IState<S>>, shouldHandler: Noop<[next: IState<S>, prev: IState<S>], boolean>): Noop
	public onChange(handler: Noop, validator?: any): Noop {
		validator = typeof validator === 'function' ? validator : (
			Array.isArray(validator) ? (next, prev) => validator.some(k => next?.[k] !== prev?.[k]) : Boolean.bind(null, 1)
		)
		const bind = (next, prev) => validator(next, prev) ? handler(next, prev) : next
		this.queue.push(bind)
		return () => Boolean(this.queue.splice(this.queue.indexOf(bind), 1))
	}

	/**
	 * @description
	 * You can also update the state of the store while outside of a component.
	 * @example
	 * window.onload = ()=>{
	 * 	useStore.set({ ready: true })
	 * }
	 */
	public set(state: DispatchParam<S>, ...args: any[]): void
	public set(state: any, ...args: any[]) {
		state = typeof state === 'function' ? state(this.value) : state
		state = Array.isArray(state) ? state : (
			(typeof (state ?? 0) === 'object' && typeof (this.value ?? 0) === 'object') ? merge(this.value, state) : state
		)
		if (state !== this.state) {
			for (const cb of this.queue)
				state = cb(state, this.value)
			this.emit('onchange', this.state = state)
		}
	}

	private onCall() {
		const [state, setState] = React.useState(this.value)
		React.useEffect(() => this.listen('onchange', setState), [setState])
		return [state, e => this.set(e)]
	}

}