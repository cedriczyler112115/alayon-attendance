<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $firstname
 * @property string|null $middlename
 * @property string $lastname
 * @property string|null $name
 * @property string $email
 * @property string $role
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read string $userlevel
 */
#[Fillable(['firstname', 'middlename', 'lastname', 'name', 'email', 'password', 'email_verified_at', 'role'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The model's default values for attributes.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'role' => 'staff',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array<int, string>
     */
    protected $appends = [
        'userlevel',
    ];

    /**
     * The "booted" method of the model.
     */
    protected static function booted(): void
    {
        static::saving(function (User $user) {
            if (empty($user->name) && ($user->firstname || $user->lastname)) {
                $user->name = trim("{$user->firstname} ".($user->middlename ? "{$user->middlename} " : '')."{$user->lastname}");
            }
        });
    }

    /**
     * Get the user's full name.
     */
    public function getNameAttribute(?string $value): string
    {
        if (! empty($value)) {
            return $value;
        }

        $parts = array_filter([$this->firstname, $this->middlename, $this->lastname]);

        return implode(' ', $parts);
    }

    /**
     * Get the user's role / userlevel formatted.
     */
    public function getUserlevelAttribute(): string
    {
        return match ($this->role) {
            'admin' => 'Admin',
            'host' => 'Host',
            default => 'Staff',
        };
    }

    /**
     * Determine if the user is an admin.
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Determine if the user is a host.
     */
    public function isHost(): bool
    {
        return $this->role === 'host';
    }

    /**
     * Determine if the user is a staff.
     */
    public function isStaff(): bool
    {
        return $this->role === 'staff';
    }

    /**
     * Check if user has any of the specified roles.
     *
     * @param  string|array<int, string>  $roles
     */
    public function hasRole(string|array $roles): bool
    {
        if (is_string($roles)) {
            $roles = array_map('trim', explode(',', $roles));
        }

        return in_array($this->role, $roles, true);
    }

    /**
     * Determine if the user can access a specific feature or section.
     */
    public function canAccess(string $feature): bool
    {
        if ($this->isAdmin()) {
            return true;
        }

        return match ($feature) {
            'dashboard' => true,
            'host' => $this->isHost(),
            'attendees' => $this->isStaff(),
            default => false,
        };
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
}
