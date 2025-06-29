// apps/api/src/audit-logs/track-changes.decorator.ts
import { UseInterceptors, SetMetadata } from '@nestjs/common';
import { DataChangeInterceptor } from './data-change.interceptor';

/**
 * Decorator to apply data change tracking to a controller method
 * @param entityType The type of entity being modified (e.g., 'users', 'assets')
 * @returns Decorator function
 */
export function TrackChanges(entityType: string) {
  return function(target: any, key: string, descriptor: PropertyDescriptor) {
    // Apply the DataChangeInterceptor
    UseInterceptors(DataChangeInterceptor)(target, key, descriptor);
    
    // Set metadata for the entity type
    SetMetadata('entityType', entityType)(target, key, descriptor);
    
    return descriptor;
  };
}
