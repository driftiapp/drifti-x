declare module 'express-validator' {
  import { Request } from 'express';

  export interface ValidationError {
    param: string;
    msg: string;
    value: any;
  }

  export interface Result {
    isEmpty(): boolean;
    array(): ValidationError[];
  }

  export function body(field: string, message?: string): any;
  export function check(field: string, message?: string): any;
  export function validationResult(req: Request): Result;
} 