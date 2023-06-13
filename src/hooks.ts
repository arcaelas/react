import React from 'react'
import { IObject, Noop, merge } from '@arcaelas/utils'

interface Signal {
	[K: string]: any
	signal: AbortSignal
	abort(): void
}
const signals: Record<string, Signal> = {}
/**
 * @description
 * With Signal you can abort some fetch or request from hooks or components without initiate new instance.
 * @example
 * 
 * function AccountBalance(){
 * 	const signal = useSignal('account:balance')
 * 	const [ balance, setBalance ] = React.useState( 0 )
 * 
 * 	React.useEffect(()=>{
 *  	fetch({
 * 			...,
 * 			signal: signal.signal,
 * 		})
 * 		return ()=>{
 * 			signal.abort()
 * 		}
 * 	}, [ ])
 * 	
 * 	return <>{ balance }</>
 * }
 * 
 */
export function useSignal(key: string): Signal {
	return signals[key] ||= {
		con: new AbortController(),
		get signal() {
			if (this.con.signal.aborted)
				this.con = new AbortController()
			return this.con.signal
		},
		get abort() {
			return this.con.abort
		},
	}
}

export function useObject<P extends IObject = IObject>(object: P): [P, Noop<[current: P], P>] {
	const [state, _set] = React.useState<any>(object)
	const setState = React.useCallback((n: any) =>
		_set((c: any) => merge({}, typeof n === 'function' ? n(c) : n))
		, [_set])
	return [state, setState]
}