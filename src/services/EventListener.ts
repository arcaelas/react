import { Noop } from "@arcaelas/utils"

type EventType = string | RegExp | EventType[]

export default class EventListener {

    private element = new EventTarget()

    on<T extends Noop>(event: EventType, handler: T) {
        const events: RegExp[] = [event as RegExp].flat(Infinity).map((e: any) => e instanceof RegExp ? e : new RegExp(e))
        const bind = ({ detail: { params, event } }: any) => (
            events.some(evt => evt.test(event)) && handler(...params)
        )
        this.element.addEventListener('*', bind)
        return () => this.element.removeEventListener('*', bind)
    }

    once<T extends Noop>(event: EventType, handler: T) {
        let unbind: any
        const bind = async (...params: any[]) => {
            await unbind()
            return handler(...params)
        }
        return unbind = this.on(event, bind)
    }

    emit(event: EventType, ...params: any[]) {
        if (params.length === 1 && params[0] instanceof Error) {
            if (params[0]['stopPropagation' as 'message']) return true
            else params[0]['stopPropagation' as 'message'] = true as any
        }
        return this.element.dispatchEvent(new CustomEvent('*', {
            detail: {
                params: params,
                event: String(event).split(/\||,/g).filter(Boolean),
            }
        }))
    }

}