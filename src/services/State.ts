import React from 'react'
import { copy, merge, type Noop, } from '@arcaelas/utils'

export type DispatchState<S> = (state: DispatchParam<S>) => void
export type DispatchParam<S> = IState<S> | ((current: IState<S>) => IState<S>)
export type IState<S> = S extends never | null | undefined ? NonNullable<S> : (
	S extends Array<never | null | undefined> ? any[] : (
		S extends Array<any> ? S : (
			S extends object ? Partial<S> & Record<string, any> : S
		)
	)
)

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
export default class State<S = any> extends Function {

	constructor(private state = null) {
		super('...args', 'return this.__call(...args)')
		return this.bind(this)
	}

	// private readonly events = new EventTarget()
	// private listen(evt: string, handler: Noop) {
	// 	const bind = ({ detail }: CustomEvent) => handler(...detail)
	// 	this.events.addEventListener(evt, bind)
	// 	return () => this.events.removeEventListener(evt, bind)
	// }
	// private emit(evt: string, ...args: any[]) {
	// 	this.events.dispatchEvent(new CustomEvent(evt, {
	// 		detail: args
	// 	}))
	// }

	/**
	 * @description
	 * Get a copy of current state, without relationship.
	 */
	get value(): S {
		return copy(this.state)
	}

	set value(value: S) {
		// this.set(value as any)
	}

	// queue = []
	// /**
	//  * @description
	//  * Fire trigger when state is changed but before change components
	//  */
	// onChange(handler: Noop<[next: S, prev: S], S>): Noop
	// /**
	//  * @description
	//  * Fire only if some those keys was changed
	//  */
	// onChange(handler: Noop<[next: S, prev: S], S>, shouldHandler: string[]): Noop
	// /**
	//  * @description
	//  * Fire only if validator function be true.
	//  */
	// onChange(handler: Noop<[next: S, prev: S], S>, shouldHandler: Noop<[next: S, prev: S], boolean>): Noop
	// onChange(handler: any, validator?: any): any {
	// 	validator = validator ? (
	// 		validator instanceof Array ? (a: any, b: any) => (validator as any).some((k: string) => a?.[k] !== b?.[k]) : validator
	// 	) : Boolean.bind(null, 1)
	// 	const subscriptor = (b: any, c: any) => (validator as any)(b, c) && handler(b, c)
	// 	this.queue.push(subscriptor)
	// 	return () => {
	// 		this.queue.splice(
	// 			this.queue.indexOf(subscriptor), 1
	// 		)
	// 	}
	// }

	// /**
	//  * @description
	//  * You can also update the state of the store while outside of a component.
	//  * @example
	//  * window.onload = ()=>{
	//  * 	useStore.set({ ready: true })
	//  * }
	//  */
	// set(state: DispatchParam<S>): void
	// async set(state: any) {
	// 	console.log('set():', { this: this, state })
	// 	await state
	// 	if (this.state === state) return
	// 	const prev = copy(this.state)
	// 	state = await (typeof state === 'function' ? state(prev) : state)
	// 	state = state instanceof Array ? [].concat(state) : (
	// 		typeof (state ?? 0) === 'object' ? merge({}, this.state, state) : state
	// 	)
	// 	for (const cb of this.queue)
	// 		state = await cb(state, prev)
	// 	this.emit('updated', this.state = state)
	// }

	private __call() {

		return [this.state, function () {
			console.log('hook():', { this: this })
		}]
		// const [state, setState] = React.useState(this.state)
		// React.useEffect(() =>
		// 	this.listen('updated', (o: any) => setState(copy(o))),
		// 	[state, setState])
		// return [state, function (value) {
		// 	console.log('Setting:', value)
		// }]
	}

}