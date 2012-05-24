/*!
 * Copyright by Oleg Efimov and
 * other node-pinba contributors
 *
 See contributors list in README
 *
 * See license text in LICENSE file
 */

#define BUILDING_NODE_EXTENSION

#include <node.h>

using namespace v8;

/**
 * Init V8 structures
 */
void InitPinba(Handle<Object> target) {
    HandleScope scope;
}

NODE_MODULE(pinba_bindings, InitPinba)
