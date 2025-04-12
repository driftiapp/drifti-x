import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { User } from '../models/user.model';
import { AppError } from '../utils/AppError';
import { AuthenticatedRequest, ApiResponse } from '../types/express';
import { IUserResponse, IAuthResponse, LeanUser } from '../types/user';
import { IErrorResponse } from '../types/error';

// Validation middleware
export const validateUser = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
];

// Preferences validation middleware
export const validatePreferences = [
  body('preferences.categories')
    .isArray()
    .withMessage('Categories must be an array')
    .custom((categories: string[]) => {
      if (!categories.length) {
        throw new Error('At least one category is required');
      }
      return true;
    }),
  body('preferences.priceRange.min')
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a positive number'),
  body('preferences.priceRange.max')
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a positive number')
    .custom((max: number, { req }: { req: Request }) => {
      if (max < req.body.preferences.priceRange.min) {
        throw new Error('Maximum price must be greater than or equal to minimum price');
      }
      return true;
    }),
  body('preferences.location').optional().trim(),
];

const toLeanUser = (user: any): LeanUser => ({
  id: user._id.toString(),
  email: user.email,
  name: user.name,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

const createUserResponse = (user: LeanUser): IUserResponse => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role
});

// Register a new user
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400);
    }

    const { email, password, name } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    const user = new User({
      email,
      password,
      name,
      role: 'user'
    });

    await user.save();

    const token = user.generateAuthToken();
    const response: IAuthResponse = {
      user: createUserResponse(toLeanUser(user)),
      token
    };

    res.status(201).json(response);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        message: error.message,
        status: error.statusCode
      } as IErrorResponse);
    } else {
      res.status(500).json({
        message: 'Error registering user',
        status: 500,
        error: error instanceof Error ? error.message : 'Unknown error'
      } as IErrorResponse);
    }
  }
};

// Login user
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid credentials', 401);
    }

    const token = user.generateAuthToken();
    const response: IAuthResponse = {
      user: createUserResponse(toLeanUser(user)),
      token
    };

    res.json(response);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        message: error.message,
        status: error.statusCode
      } as IErrorResponse);
    } else {
      res.status(500).json({
        message: 'Error logging in',
        status: 500,
        error: error instanceof Error ? error.message : 'Unknown error'
      } as IErrorResponse);
    }
  }
};

// Get user profile
export const getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const response: IUserResponse = createUserResponse(toLeanUser(user));
    res.json(response);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        message: error.message,
        status: error.statusCode
      } as IErrorResponse);
    } else {
      res.status(500).json({
        message: 'Error getting profile',
        status: 500,
        error: error instanceof Error ? error.message : 'Unknown error'
      } as IErrorResponse);
    }
  }
};

// Update user preferences
export const updatePreferences = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { preferences } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { preferences } },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const userResponse = createUserResponse(toLeanUser(user));
    res.json({
      message: 'Preferences updated successfully',
      user: userResponse
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        message: error.message,
        status: error.statusCode
      } as IErrorResponse);
    } else {
      res.status(500).json({
        message: 'Error updating preferences',
        status: 500,
        error: error instanceof Error ? error.message : 'Unknown error'
      } as IErrorResponse);
    }
  }
};