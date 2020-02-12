import {
    LOCAL_STORE_KEY
} from './const';

export default function createUUID(a?): string {
    return LOCAL_STORE_KEY + new Date().getTime();
}