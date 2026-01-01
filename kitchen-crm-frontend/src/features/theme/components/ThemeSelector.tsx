/**
 * Theme Selector Component
 * Visual theme selector with preview cards
 */

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { setTheme, selectCurrentThemeId } from '../themeSlice';
import { themeList, type Theme } from '../../../styles/themes';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Palette, Check, Moon, Sun } from 'lucide-react';
import toast from 'react-hot-toast';

export function ThemeSelector() {
  const dispatch = useAppDispatch();
  const currentThemeId = useAppSelector(selectCurrentThemeId);

  const handleThemeChange = (themeId: string) => {
    dispatch(setTheme(themeId));
    toast.success('Theme changed successfully!');
  };

  const ThemePreviewCard = ({ theme }: { theme: Theme }) => {
    const isActive = theme.id === currentThemeId;
    const isDark = theme.type === 'dark';

    return (
      <Card
        className={`relative p-4 border-2 transition-all cursor-pointer hover:scale-105 ${
          isActive
            ? 'border-primary-500 shadow-lg shadow-primary-500/20'
            : 'border-background-600 hover:border-primary-600'
        }`}
        onClick={() => handleThemeChange(theme.id)}
      >
        {/* Active indicator */}
        {isActive && (
          <div className="absolute top-2 right-2 z-10">
            <div className="bg-primary-500 text-white rounded-full p-1">
              <Check className="w-4 h-4" />
            </div>
          </div>
        )}

        {/* Theme type badge */}
        <div className="absolute top-2 left-2 z-10">
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
              isDark
                ? 'bg-gray-800 text-gray-200'
                : 'bg-gray-200 text-gray-800'
            }`}
          >
            {isDark ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
            <span>{isDark ? 'Dark' : 'Light'}</span>
          </div>
        </div>

        {/* Theme name */}
        <div className="mb-3 mt-8">
          <h3 className="text-lg font-bold text-text-900">{theme.name}</h3>
          <p className="text-sm text-text-600 mt-1">{theme.description}</p>
        </div>

        {/* Color preview */}
        <div className="space-y-2">
          {/* Primary colors */}
          <div>
            <p className="text-xs text-text-600 mb-1">Primary</p>
            <div className="flex gap-1">
              <div
                className="h-8 flex-1 rounded"
                style={{ backgroundColor: theme.colors.primary[700] }}
              />
              <div
                className="h-8 flex-1 rounded"
                style={{ backgroundColor: theme.colors.primary[600] }}
              />
              <div
                className="h-8 flex-1 rounded"
                style={{ backgroundColor: theme.colors.primary[500] }}
              />
              <div
                className="h-8 flex-1 rounded"
                style={{ backgroundColor: theme.colors.primary[400] }}
              />
            </div>
          </div>

          {/* Accent colors */}
          <div>
            <p className="text-xs text-text-600 mb-1">Accent</p>
            <div className="flex gap-1">
              <div
                className="h-8 flex-1 rounded"
                style={{ backgroundColor: theme.colors.accent[700] }}
              />
              <div
                className="h-8 flex-1 rounded"
                style={{ backgroundColor: theme.colors.accent[600] }}
              />
              <div
                className="h-8 flex-1 rounded"
                style={{ backgroundColor: theme.colors.accent[500] }}
              />
              <div
                className="h-8 flex-1 rounded"
                style={{ backgroundColor: theme.colors.accent[400] }}
              />
            </div>
          </div>

          {/* Background preview */}
          <div>
            <p className="text-xs text-text-600 mb-1">Background</p>
            <div className="flex gap-1">
              <div
                className="h-8 flex-1 rounded border border-background-600"
                style={{ backgroundColor: theme.colors.background[900] }}
              />
              <div
                className="h-8 flex-1 rounded border border-background-600"
                style={{ backgroundColor: theme.colors.background[800] }}
              />
              <div
                className="h-8 flex-1 rounded border border-background-600"
                style={{ backgroundColor: theme.colors.background[700] }}
              />
              <div
                className="h-8 flex-1 rounded border border-background-600"
                style={{ backgroundColor: theme.colors.background[600] }}
              />
            </div>
          </div>
        </div>

        {/* Apply button */}
        <div className="mt-4">
          <Button
            variant={isActive ? 'secondary' : 'primary'}
            size="sm"
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              handleThemeChange(theme.id);
            }}
            disabled={isActive}
          >
            {isActive ? 'Active' : 'Apply Theme'}
          </Button>
        </div>
      </Card>
    );
  };

  // Separate themes by type
  const darkThemes = themeList.filter((t) => t.type === 'dark');
  const lightThemes = themeList.filter((t) => t.type === 'light');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-900/20 via-primary-800/20 to-accent-900/20 border border-primary-600/30 rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary-600/20 rounded-xl flex items-center justify-center">
            <Palette className="w-8 h-8 text-primary-500" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-text-900 mb-2">
              Theme Configuration
            </h2>
            <p className="text-text-600 text-lg">
              Choose a theme to customize the appearance of your application
            </p>
          </div>
        </div>
      </div>

      {/* Dark Themes Section */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Moon className="w-5 h-5 text-primary-500" />
          <h3 className="text-xl font-bold text-text-900">Dark Themes</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {darkThemes.map((theme) => (
            <ThemePreviewCard key={theme.id} theme={theme} />
          ))}
        </div>
      </div>

      {/* Light Themes Section */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Sun className="w-5 h-5 text-primary-500" />
          <h3 className="text-xl font-bold text-text-900">Light Themes</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {lightThemes.map((theme) => (
            <ThemePreviewCard key={theme.id} theme={theme} />
          ))}
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-background-800 border-background-600">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-primary-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Palette className="w-6 h-6 text-primary-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-text-900 mb-3">
              About Themes
            </h3>
            <ul className="space-y-2 text-text-600 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>
                  Themes change the color scheme across the entire application
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>
                  Your theme preference is saved automatically and will persist
                  across sessions
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>
                  Dark themes are easier on the eyes in low-light conditions
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>
                  Light themes provide a clean, professional appearance
                </span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default ThemeSelector;

