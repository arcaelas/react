import React from 'react'
import { copy, merge, } from '@arcaelas/utils'

type Noop<A = any, R = any> = (...args: A extends any[] ? A : A[]) => R;
type Dispatch<T> = T | Noop<[current: T], T>
interface Store<S = any> {
	(): [S, Dispatch<S>]

	/**
	 * @description
	 * Fire trigger when state is changed but before change components
	*/
	onChange(handler: Noop<[next: S, prev: S], S>): Noop
	/**
	 * @description
	 * Fire only if some those keys was changed
	*/
	onChange(handler: Noop<[next: S, prev: S], S>, keys: string[]): Noop
	/**
	 * @description
	 * Fire only if validator function be true.
	*/
	onChange(handler: Noop<[next: S, prev: S], S>, validator: Noop<[next: S, prev: S], boolean>): Noop

	/**
	 * @description
	 * You can also update the state of the store while outside of a component.
	 * @example
	 * window.onload = ()=>{
	 * 	useStore.set({ ready: true })
	 * }
	 */
	set(value: S): S
	set(value: Noop<[current: S], S>): S
}

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
export default function createStore<S = any>(initialState: S): Store<S> {
	const events = new EventTarget()
	function listen(evt: string, handler: Noop) {
		const bind: any = ({ detail }: CustomEvent) => handler(...detail)
		events.addEventListener(evt, bind)
		return () => events.removeEventListener(evt, bind)
	}
	function emit(evt: string, ...args: any[]) {
		return events.dispatchEvent(new CustomEvent(evt, {
			detail: args
		}))
	}

	let state: S = copy(initialState)
	function useStore() {
		const [store, setStore] = React.useState(state)
		React.useEffect(() => listen('onchange', e => setStore(e)), [setStore])
		return [store, useStore.prototype.set.bind(useStore)]
	}
	useStore.prototype.set = function set() { } as any
	useStore.prototype.onChange = function onchange() { } as any

	const queue: Noop[] = []
	useStore.prototype.onChange = function onChange(handler: Noop<[next: S, prev: S], S>, validator?: string[] | Noop<[next: S, prev: S], boolean>): Noop {
		validator = typeof validator === 'function' ? validator : (
			validator instanceof Array ? (next: any, prev: any) => (validator as string[]).some(k => next?.[k] !== prev?.[k]) : Boolean.bind(null, 1)
		)
		const bind = (next: S, prev: S) => (validator as any)(next, prev) && handler(next, prev)
		queue.push(bind)
		return () => Boolean(queue.splice(queue.indexOf(bind), 1))
	}
	useStore.prototype.set = function set(value: any) {
		const current = copy(state)
		value = typeof value === 'function' ? value(copy(current)) : value
		value = Array.isArray(value) ? value : (
			(typeof (value ?? 0) === 'object' && typeof (state ?? 0) === 'object') ? merge({}, state, value) : value
		)
		if (value !== state) {
			for (const cb of queue)
				value = cb(value, copy(current))
			emit('onchange', state = value)
		}
	}

	return useStore as Store<S>
}